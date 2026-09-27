import { NextRequest, NextResponse } from "next/server";
import {
  addToDoNotContact,
  getAllLeads,
  getSettings,
  logAuditEvent,
  saveLead,
} from "@/lib/storage/store";
import { classifyIncomingReply } from "@/lib/ai/replyClassifier";
import type { OutreachMessage } from "@/lib/types";

/**
 * GET: Webhook verifikacija od strane Meta WhatsApp Business Platforme
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "local_lead_program_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("[WhatsApp Webhook] Uspješno verificiran webhook od strane Meta.");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WhatsApp Webhook] Neuspješna verifikacija. Token se ne podudara.");
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Prijem dolaznih poruka i statusa dostave sa Meta WhatsApp API-ja
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entries = body.entry || [];
    const settings = getSettings();
    const allLeads = getAllLeads();

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value || {};

        // 1. OBRADA STATUSNIH DOSTAVA (SENT, DELIVERED, READ, FAILED)
        if (val.statuses && val.statuses.length > 0) {
          for (const st of val.statuses) {
            const wamid = st.id;
            const statusName = st.status; // "delivered", "read", "failed"

            for (const lead of allLeads) {
              if (lead.conversation && lead.conversation.length > 0) {
                const targetMsg = lead.conversation.find(
                  (m) => m.whatsappMessageId === wamid
                );
                if (targetMsg) {
                  targetMsg.status = statusName;
                  saveLead(lead);
                }
              }
            }
          }
        }

        // 2. OBRADA PRISTIGLIH DOLAZNIH PORUKA
        if (val.messages && val.messages.length > 0) {
          for (const msg of val.messages) {
            const fromRaw = msg.from; // npr. "38761123456"
            const fromDigits = fromRaw.replace(/[^0-9]/g, "");
            const textBody =
              msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || "";

            // Pronađi odgovarajući lead po broju telefona
            let matchedLead = allLeads.find((l) => {
              if (!l.phone) return false;
              const leadClean = l.phone.replace(/[^0-9]/g, "");
              return (
                leadClean.endsWith(fromDigits) ||
                fromDigits.endsWith(leadClean) ||
                leadClean === fromDigits
              );
            });

            // Klasifikacija odgovora
            const classification = classifyIncomingReply(textBody, settings);

            if (matchedLead) {
              const incomingMsg: OutreachMessage = {
                id: `incoming-${Date.now()}`,
                leadId: matchedLead.id,
                direction: "incoming",
                text: textBody,
                whatsappMessageId: msg.id,
                status: "read",
                timestamp: new Date().toISOString(),
                aiClassification: classification.classification,
                aiSuggestedResponse: classification.suggestedResponse,
              };

              matchedLead.conversation = [
                ...(matchedLead.conversation || []),
                incomingMsg,
              ];

              // Ako je klijent zatražio STOP -> automatski DO NOT CONTACT!
              if (classification.isStopRequest) {
                addToDoNotContact(
                  fromDigits,
                  `Automatski STOP zahtjev: "${textBody}"`,
                  matchedLead.name
                );
                matchedLead.status = "DO_NOT_CONTACT";
                matchedLead.doNotContact = true;
                matchedLead.doNotContactReason = `Automatski STOP zahtjev: "${textBody}"`;
                matchedLead.nextFollowupAt = null;

                logAuditEvent({
                  leadId: matchedLead.id,
                  businessName: matchedLead.name,
                  action: "DO_NOT_CONTACT",
                  status: "warning",
                  channel: "whatsapp",
                  source: "webhook",
                  details: `Automatski detektovan STOP: "${textBody}"`,
                });
              } else if (classification.classification === "INTERESTED") {
                matchedLead.status = "INTERESTED";
                matchedLead.nextFollowupAt = null; // Zaustavi automatske follow-upove
              } else if (classification.classification === "PRICE_REQUEST") {
                matchedLead.status = "INTERESTED";
                matchedLead.nextFollowupAt = null;
              } else if (classification.classification === "NOT_INTERESTED") {
                matchedLead.status = "NOT_INTERESTED";
                matchedLead.nextFollowupAt = null;
              } else {
                matchedLead.status = "REPLIED";
                matchedLead.nextFollowupAt = null;
              }

              saveLead(matchedLead);

              logAuditEvent({
                leadId: matchedLead.id,
                businessName: matchedLead.name,
                action: "REPLY_RECEIVED",
                status: "success",
                channel: "whatsapp",
                source: "webhook",
                messageId: msg.id,
                details: `Odgovor (${classification.classification}): "${textBody}"`,
              });
            } else {
              // Ako lead nije unaprijed pronađen, samo evidentiraj u audit
              logAuditEvent({
                leadId: `unknown-${fromDigits}`,
                businessName: `Nepoznat pošiljalac (${fromDigits})`,
                action: "REPLY_RECEIVED",
                status: "info",
                channel: "whatsapp",
                source: "webhook",
                details: `Nepoznat broj ${fromDigits}: "${textBody}"`,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (err) {
    console.error("[WhatsApp Webhook] Greška pri obradi webhook-a:", err);
    // Vraćamo 200 da Meta ne bi ponavljala slanje istog pogrešnog paketa
    return NextResponse.json({ status: "ERROR_HANDLED" });
  }
}
