import {
  getAllLeads,
  getSettings,
  getTemplates,
  logAuditEvent,
  saveLead,
} from "../storage/store";
import { checkWhatsAppEligibility, sendWhatsAppMessage } from "./client";
import { generateOutreachMessage } from "../ai/messageGenerator";
import type { AppSettings, Lead, OutreachMessage } from "../types";

// In-memory evidencija poslatih poruka za rate limiting
interface RateLimitTracker {
  todaySends: number;
  lastResetDay: string;
  hourlySends: number[];
  lastSendTimestamp: number;
}

const tracker: RateLimitTracker = {
  todaySends: 0,
  lastResetDay: new Date().toISOString().slice(0, 10),
  hourlySends: [],
  lastSendTimestamp: 0,
};

function checkAndResetDay(): void {
  const currentDay = new Date().toISOString().slice(0, 10);
  if (tracker.lastResetDay !== currentDay) {
    tracker.lastResetDay = currentDay;
    tracker.todaySends = 0;
    tracker.hourlySends = [];
  }

  // Očisti evidenciju stariju od 1 sata
  const oneHourAgo = Date.now() - 3600 * 1000;
  tracker.hourlySends = tracker.hourlySends.filter((ts) => ts > oneHourAgo);
}

/**
 * Provjerava da li je slanje trenutno dozvoljeno prema postavljenim limitima.
 */
export function canSendNow(settings: AppSettings): {
  allowed: boolean;
  reason?: string;
  waitSeconds?: number;
} {
  checkAndResetDay();

  // 1. Dnevni limit
  if (tracker.todaySends >= settings.maxDailyOutreach) {
    return {
      allowed: false,
      reason: `Dosegnut je maksimalni dnevni limit (${settings.maxDailyOutreach} poruka/dan). Auto outreach je pauziran do sutra.`,
    };
  }

  // 2. Satni limit
  if (tracker.hourlySends.length >= settings.maxHourlyOutreach) {
    return {
      allowed: false,
      reason: `Dosegnut je satni limit (${settings.maxHourlyOutreach} poruka/sat). Čekam istek satnog intervala.`,
    };
  }

  // 3. Minimalni razmak između poruka
  const now = Date.now();
  const elapsedSeconds = (now - tracker.lastSendTimestamp) / 1000;
  if (tracker.lastSendTimestamp > 0 && elapsedSeconds < settings.minDelaySeconds) {
    const waitSeconds = Math.ceil(settings.minDelaySeconds - elapsedSeconds);
    return {
      allowed: false,
      reason: `Minimalni razmak između poruka: sačekajte još ${waitSeconds} sekundi.`,
      waitSeconds,
    };
  }

  return { allowed: true };
}

/**
 * Bilježi uspješno poslano javljanje za potrebe limitera.
 */
export function recordSend(): void {
  const now = Date.now();
  tracker.todaySends++;
  tracker.hourlySends.push(now);
  tracker.lastSendTimestamp = now;
}

export interface AutoOutreachRunResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
  logs: string[];
}

/**
 * Automatska obrada outreach queue-a za sve pripremljene leadove.
 */
export async function processOutreachQueue(): Promise<AutoOutreachRunResult> {
  const settings = getSettings();
  const logs: string[] = [];

  if (!settings.autoOutreachEnabled) {
    return {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      logs: ["AUTO OUTREACH je isključen (PAUSED). Uključite ga u postavkama."],
    };
  }

  const allLeads = getAllLeads();
  // Filtriraj leadove koji su spremni za slanje
  const queue = allLeads.filter(
    (l) =>
      !l.doNotContact &&
      (l.status === "READY_TO_SEND" ||
        l.status === "MESSAGE_READY" ||
        (l.status === "FOLLOW_UP" &&
          l.nextFollowupAt &&
          new Date(l.nextFollowupAt).getTime() <= Date.now()))
  );

  logs.push(`Pronađeno ${queue.length} kandidata u queue-u.`);

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const templates = getTemplates();
  const activeTemplate =
    templates.find((t) => t.name === settings.activeTemplate) || templates[0];

  for (const lead of queue) {
    // Provjeri limite
    const limitCheck = canSendNow(settings);
    if (!limitCheck.allowed) {
      logs.push(`Limiter zaustavio slanje: ${limitCheck.reason}`);
      break;
    }

    const isFollowup = lead.status === "FOLLOW_UP";
    const eligibility = checkWhatsAppEligibility(lead, settings, isFollowup);

    if (!eligibility.isEligible) {
      logs.push(`Lead "${lead.name}" preskočen: ${eligibility.reason}`);
      lead.status = "NOT_ELIGIBLE";
      lead.eligibility = eligibility;
      saveLead(lead);
      skipped++;
      continue;
    }

    // Generiši poruku ako već nije pripremljena
    const followupNum = (lead.followupCount || 0) + 1;
    const msgGen = generateOutreachMessage(
      lead,
      settings,
      activeTemplate,
      isFollowup,
      followupNum
    );

    logAuditEvent({
      leadId: lead.id,
      businessName: lead.name,
      action: "WHATSAPP_SEND_ATTEMPT",
      status: "info",
      channel: "whatsapp",
      source: "cron",
      details: `Pokušaj slanja na ${eligibility.normalizedPhone} (${msgGen.templateName})`,
    });

    // Pošalji kroz službeni WhatsApp API
    const sendRes = await sendWhatsAppMessage({
      toPhone: eligibility.normalizedPhone!,
      messageType: settings.whatsappMessageType,
      templateName: msgGen.templateName,
      templateParameters: msgGen.componentParameters,
      textBody: msgGen.fullText,
    });

    if (sendRes.success) {
      recordSend();
      sent++;

      const newMsg: OutreachMessage = {
        id: `msg-${Date.now()}`,
        leadId: lead.id,
        direction: "outgoing",
        text: msgGen.fullText,
        templateName: msgGen.templateName,
        templateVariables: msgGen.variables,
        whatsappMessageId: sendRes.messageId,
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      lead.status = "SENT";
      lead.lastContactAt = new Date().toISOString();
      lead.conversation = [...(lead.conversation || []), newMsg];
      lead.generatedMessage = msgGen.fullText;
      lead.selectedTemplate = msgGen.templateName;

      // Zakaži sljedeći follow-up ako je dozvoljeno
      if (followupNum < settings.maxFollowups) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + settings.followupDelayDays);
        lead.nextFollowupAt = nextDate.toISOString();
        lead.followupCount = followupNum;
      } else {
        lead.nextFollowupAt = null;
        lead.followupCount = followupNum;
      }

      saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "WHATSAPP_SENT",
        status: "success",
        channel: "whatsapp",
        messageId: sendRes.messageId,
        source: "cron",
        details: `Poruka uspješno poslana (${msgGen.templateName})`,
      });

      logs.push(`✅ Poslano za "${lead.name}" (${eligibility.formattedPhone})`);
    } else {
      errors++;
      lead.status = "ERROR";
      lead.lastError = {
        code: sendRes.errorCode,
        message: sendRes.errorMessage || "Nepoznata greška",
        timestamp: new Date().toISOString(),
      };
      saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "WHATSAPP_FAILED",
        status: "error",
        channel: "whatsapp",
        error: `${sendRes.errorCode}: ${sendRes.errorMessage}`,
        source: "cron",
        details: `Greška pri slanju: ${sendRes.errorMessage}`,
      });

      logs.push(`❌ Greška za "${lead.name}": ${sendRes.errorMessage}`);
    }
  }

  return {
    processed: queue.length,
    sent,
    skipped,
    errors,
    logs,
  };
}
