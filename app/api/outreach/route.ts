import { NextRequest, NextResponse } from "next/server";
import {
  addToDoNotContact,
  getAllLeads,
  getLeadById,
  getOutreachStats,
  getSettings,
  getTemplates,
  logAuditEvent,
  saveLead,
} from "@/lib/storage/store";
import { analyzeLeadWithAI } from "@/lib/ai/leadAnalyzer";
import { generateOutreachMessage } from "@/lib/ai/messageGenerator";
import { checkWhatsAppEligibility, sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { canSendNow, recordSend } from "@/lib/whatsapp/queue";
import type { Lead, OutreachMessage } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const leads = getAllLeads();
    const stats = getOutreachStats();
    const settings = getSettings();
    const templates = getTemplates();
    const rateLimit = canSendNow(settings);

    return NextResponse.json({
      leads,
      stats,
      settings,
      templates,
      rateLimit,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, leadId, leadData, reason, newStatus, customText, templateName } = body;

    const settings = getSettings();

    // 1. SAVE LEAD (Import iz pretrage u outreach bazu)
    if (action === "save-lead") {
      if (!leadData || !leadData.id) {
        return NextResponse.json(
          { error: "Podaci o lead-u su obavezni." },
          { status: 400 }
        );
      }
      const saved = saveLead({
        ...leadData,
        status: leadData.status || "NEW",
      });
      return NextResponse.json({ success: true, lead: saved });
    }

    // 2. AI ANALYZE
    if (action === "analyze") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead && leadData) {
        lead = saveLead(leadData);
      }
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      lead.status = "ANALYZING";
      saveLead(lead);

      const analysis = await analyzeLeadWithAI(lead);
      lead.analysis = analysis;
      lead.status = "NEW"; // Spreman za generisanje poruke
      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "AI_ANALYSIS_COMPLETED",
        status: "success",
        channel: "ai",
        source: "manual",
        details: `Završena AI analiza: ${analysis.bestSalesAngle}`,
      });

      return NextResponse.json({ success: true, lead: updated, analysis });
    }

    // 3. GENERATE MESSAGE
    if (action === "generate-message") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead && leadData) {
        lead = saveLead(leadData);
      }
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      const templates = getTemplates();
      const template =
        templates.find((t) => t.name === (templateName || settings.activeTemplate)) ||
        templates[0];

      const isFollowup = lead.status === "FOLLOW_UP";
      const followupNum = (lead.followupCount || 0) + 1;

      const msgResult = generateOutreachMessage(
        lead,
        settings,
        template,
        isFollowup,
        followupNum
      );

      lead.generatedMessage = msgResult.fullText;
      lead.selectedTemplate = msgResult.templateName;
      lead.status = "MESSAGE_READY";

      // Provjeri i postavi eligibility
      const eligibility = checkWhatsAppEligibility(lead, settings, isFollowup);
      lead.eligibility = eligibility;
      if (eligibility.isEligible) {
        lead.status = "READY_TO_SEND";
      } else {
        lead.status = "NOT_ELIGIBLE";
      }

      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "AI_MESSAGE_GENERATED",
        status: "success",
        channel: "ai",
        source: "manual",
        details: `Generisana poruka za template "${msgResult.templateName}"`,
      });

      return NextResponse.json({
        success: true,
        lead: updated,
        message: msgResult.fullText,
        eligibility,
      });
    }

    // 4. SEND WHATSAPP
    if (action === "send") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead && leadData) {
        lead = saveLead(leadData);
      }
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      const isFollowup = lead.status === "FOLLOW_UP";
      const eligibility = checkWhatsAppEligibility(lead, settings, isFollowup);

      if (!eligibility.isEligible) {
        lead.status = "NOT_ELIGIBLE";
        lead.eligibility = eligibility;
        saveLead(lead);
        return NextResponse.json(
          {
            success: false,
            status: "NOT_ELIGIBLE",
            error: eligibility.reason || "Lead nije podoban za WhatsApp slanje.",
          },
          { status: 400 }
        );
      }

      // Provjeri rate limit
      const limitCheck = canSendNow(settings);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            status: "RATE_LIMITED",
            error: limitCheck.reason,
            waitSeconds: limitCheck.waitSeconds,
          },
          { status: 429 }
        );
      }

      // Pripremi poruku
      const templates = getTemplates();
      const template =
        templates.find((t) => t.name === (templateName || lead.selectedTemplate || settings.activeTemplate)) ||
        templates[0];

      const followupNum = (lead.followupCount || 0) + 1;
      const msgResult = generateOutreachMessage(
        lead,
        settings,
        template,
        isFollowup,
        followupNum
      );

      const textToSend = customText || lead.generatedMessage || msgResult.fullText;

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "WHATSAPP_SEND_ATTEMPT",
        status: "info",
        channel: "whatsapp",
        source: "manual",
        details: `Ručno slanje na ${eligibility.normalizedPhone}`,
      });

      // Poziv Meta WhatsApp Cloud API
      const sendRes = await sendWhatsAppMessage({
        toPhone: eligibility.normalizedPhone!,
        messageType: settings.whatsappMessageType,
        templateName: msgResult.templateName,
        templateParameters: msgResult.componentParameters,
        textBody: textToSend,
      });

      if (sendRes.success) {
        recordSend();

        const newMsg: OutreachMessage = {
          id: `msg-${Date.now()}`,
          leadId: lead.id,
          direction: "outgoing",
          text: textToSend,
          templateName: msgResult.templateName,
          templateVariables: msgResult.variables,
          whatsappMessageId: sendRes.messageId,
          status: "sent",
          timestamp: new Date().toISOString(),
        };

        lead.status = "SENT";
        lead.lastContactAt = new Date().toISOString();
        lead.conversation = [...(lead.conversation || []), newMsg];
        lead.generatedMessage = textToSend;
        lead.selectedTemplate = msgResult.templateName;
        lead.lastError = null;

        // Zakaži sljedeći follow-up ako je u granicama
        if (followupNum < settings.maxFollowups) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + settings.followupDelayDays);
          lead.nextFollowupAt = nextDate.toISOString();
          lead.followupCount = followupNum;
        } else {
          lead.nextFollowupAt = null;
          lead.followupCount = followupNum;
        }

        const updated = saveLead(lead);

        logAuditEvent({
          leadId: lead.id,
          businessName: lead.name,
          action: "WHATSAPP_SENT",
          status: "success",
          channel: "whatsapp",
          messageId: sendRes.messageId,
          source: "manual",
          details: `Uspješno poslana poruka (${msgResult.templateName})`,
        });

        return NextResponse.json({ success: true, lead: updated, messageId: sendRes.messageId });
      } else {
        lead.status = "ERROR";
        lead.lastError = {
          code: sendRes.errorCode,
          message: sendRes.errorMessage || "Greška pri slanju",
          timestamp: new Date().toISOString(),
        };
        const updated = saveLead(lead);

        logAuditEvent({
          leadId: lead.id,
          businessName: lead.name,
          action: "WHATSAPP_FAILED",
          status: "error",
          channel: "whatsapp",
          error: `${sendRes.errorCode}: ${sendRes.errorMessage}`,
          source: "manual",
        });

        return NextResponse.json(
          {
            success: false,
            status: "ERROR",
            error: sendRes.errorMessage,
            errorCode: sendRes.errorCode,
            lead: updated,
          },
          { status: 400 }
        );
      }
    }

    // 4b. DIRECT WHATSAPP SENT (Otvoreno i poslano direktno preko WhatsAppa)
    if (action === "mark-sent") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead && leadData) {
        lead = saveLead(leadData);
      }
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      const textToSend = customText || lead.generatedMessage || "Pozdrav, javio sam se u vezi vaše web stranice.";
      const newMsg: OutreachMessage = {
        id: `msg-${Date.now()}`,
        leadId: lead.id,
        direction: "outgoing",
        text: textToSend,
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      lead.conversation = [...(lead.conversation || []), newMsg];
      lead.status = "SENT";
      lead.lastContactAt = new Date().toISOString();
      lead.lastError = null;

      const followupNum = (lead.followupCount || 0) + 1;
      if (followupNum < settings.maxFollowups) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + settings.followupDelayDays);
        lead.nextFollowupAt = nextDate.toISOString();
        lead.followupCount = followupNum;
      } else {
        lead.nextFollowupAt = null;
        lead.followupCount = followupNum;
      }

      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "WHATSAPP_SENT",
        status: "success",
        channel: "whatsapp",
        source: "manual",
        details: "Poruka poslana direktno preko WhatsApp aplikacije",
      });

      return NextResponse.json({ success: true, lead: updated });
    }

    // 5. DO NOT CONTACT
    if (action === "dnc") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead && leadData) {
        lead = saveLead(leadData);
      }
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      const dncReason = reason || "Ručno postavljen DO NOT CONTACT od strane korisnika";
      if (lead.phone) {
        addToDoNotContact(lead.phone, dncReason, lead.name);
      }

      lead.status = "DO_NOT_CONTACT";
      lead.doNotContact = true;
      lead.doNotContactReason = dncReason;
      lead.nextFollowupAt = null;
      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "DO_NOT_CONTACT",
        status: "warning",
        channel: "system",
        source: "manual",
        details: `Lead označen kao DO NOT CONTACT (${dncReason})`,
      });

      return NextResponse.json({ success: true, lead: updated });
    }

    // 6. SCHEDULE FOLLOW-UP
    if (action === "schedule-followup") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      const days = Number(body.days || settings.followupDelayDays || 3);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);

      lead.status = "FOLLOW_UP";
      lead.nextFollowupAt = nextDate.toISOString();
      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "FOLLOWUP_SCHEDULED",
        status: "info",
        channel: "system",
        source: "manual",
        details: `Follow-up zakazan za ${days} dana (${lead.nextFollowupAt})`,
      });

      return NextResponse.json({ success: true, lead: updated });
    }

    // 7. CHANGE STATUS
    if (action === "change-status") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }

      lead.status = newStatus;
      if (newStatus === "DO_NOT_CONTACT" && lead.phone) {
        addToDoNotContact(lead.phone, "Status promijenjen na DO_NOT_CONTACT", lead.name);
      }
      const updated = saveLead(lead);

      logAuditEvent({
        leadId: lead.id,
        businessName: lead.name,
        action: "STATUS_CHANGED",
        status: "info",
        channel: "system",
        source: "manual",
        details: `Status promijenjen na "${newStatus}"`,
      });

      return NextResponse.json({ success: true, lead: updated });
    }

    // 8. SEND MANUAL REPLY IN CONVERSATION
    if (action === "send-reply") {
      let lead = leadId ? getLeadById(leadId) : null;
      if (!lead) {
        return NextResponse.json({ error: "Lead nije pronađen." }, { status: 404 });
      }
      if (!customText || !customText.trim()) {
        return NextResponse.json({ error: "Tekst poruke je obavezan." }, { status: 400 });
      }

      const norm = lead.eligibility?.normalizedPhone || (lead.phone ? lead.phone.replace(/[^0-9]/g, "") : "");
      if (!norm) {
        return NextResponse.json({ error: "Nevažeći broj telefona." }, { status: 400 });
      }

      const sendRes = await sendWhatsAppMessage({
        toPhone: norm,
        messageType: "freeform",
        textBody: customText.trim(),
      });

      if (sendRes.success) {
        const newMsg: OutreachMessage = {
          id: `msg-${Date.now()}`,
          leadId: lead.id,
          direction: "outgoing",
          text: customText.trim(),
          whatsappMessageId: sendRes.messageId,
          status: "sent",
          timestamp: new Date().toISOString(),
        };

        lead.conversation = [...(lead.conversation || []), newMsg];
        lead.lastContactAt = new Date().toISOString();
        const updated = saveLead(lead);

        return NextResponse.json({ success: true, lead: updated });
      } else {
        return NextResponse.json(
          { success: false, error: sendRes.errorMessage, errorCode: sendRes.errorCode },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Nepoznata akcija." }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
