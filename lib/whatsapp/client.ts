import { normalizePhoneNumber } from "./phoneUtils";
import { isDoNotContact } from "../storage/store";
import type { AppSettings, Lead } from "../types";

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  status: "SENT" | "ERROR" | "NOT_ELIGIBLE";
}

export interface EligibilityResult {
  isEligible: boolean;
  normalizedPhone: string | null;
  formattedPhone: string;
  phoneType: "mobile" | "landline" | "invalid";
  reason?: string;
}

/**
 * Provjerava podobnost lead-a za WhatsApp outreach prema pravilima Meta platforme.
 */
export function checkWhatsAppEligibility(
  lead: Lead,
  settings: AppSettings,
  isFollowup = false
): EligibilityResult {
  // 1. Provjera postojanja broja telefona
  if (!lead.phone || !lead.phone.trim()) {
    return {
      isEligible: false,
      normalizedPhone: null,
      formattedPhone: "",
      phoneType: "invalid",
      reason: "Biznis nema naveden broj telefona.",
    };
  }

  // 2. Normalizacija broja
  const norm = normalizePhoneNumber(lead.phone);
  if (!norm.isValid) {
    return {
      isEligible: false,
      normalizedPhone: null,
      formattedPhone: norm.raw,
      phoneType: "invalid",
      reason: norm.reason || "Format broja telefona nije važeći.",
    };
  }

  // 3. Provjera DO NOT CONTACT liste
  if (isDoNotContact(norm.e164, lead.name) || lead.doNotContact) {
    return {
      isEligible: false,
      normalizedPhone: norm.e164,
      formattedPhone: norm.formatted,
      phoneType: norm.type === "mobile" ? "mobile" : "landline",
      reason:
        "Broj ili biznis se nalazi na DO NOT CONTACT listi. Kontaktiranje je zabranjeno.",
    };
  }

  // 4. Provjera duplikata (ako je već poslana poruka i nije follow-up)
  if (!isFollowup && (lead.status === "SENT" || lead.status === "REPLIED" || (lead.conversation && lead.conversation.length > 0))) {
    return {
      isEligible: false,
      normalizedPhone: norm.e164,
      formattedPhone: norm.formatted,
      phoneType: norm.type === "mobile" ? "mobile" : "landline",
      reason:
        "Duplikat zaštićen: Ovaj biznis je već kontaktiran i nalazi se u aktivnoj komunikaciji.",
    };
  }

  // 5. Provjera fiksne linije (landline)
  if (norm.type === "landline") {
    return {
      isEligible: false,
      normalizedPhone: norm.e164,
      formattedPhone: norm.formatted,
      phoneType: "landline",
      reason:
        "Broj je fiksna linija (npr. 032, 033, 030). WhatsApp API podržava isključivo mobilne brojeve ili specijalno registrovane WhatsApp fiksne linije.",
    };
  }

  // 6. WhatsApp Policy / Opt-In provjera za inicijalni kontakt
  // Van 24h korisničkog prozora Meta zahtijeva registrovani odobreni template
  if (
    !isFollowup &&
    settings.whatsappMessageType === "freeform" &&
    (!lead.conversation || lead.conversation.length === 0)
  ) {
    return {
      isEligible: false,
      normalizedPhone: norm.e164,
      formattedPhone: norm.formatted,
      phoneType: "mobile",
      reason:
        "Meta WhatsApp pravilo: Za novi poslovni kontakt van 24-satnog prozora OBAVEZAN je odobren WhatsApp Template. U postavkama promijenite Message Type na 'Approved Template'.",
    };
  }

  return {
    isEligible: true,
    normalizedPhone: norm.e164,
    formattedPhone: norm.formatted,
    phoneType: "mobile",
  };
}

/**
 * Šalje WhatsApp poruku kroz službeni Meta Cloud API v20.0
 */
export async function sendWhatsAppMessage(options: {
  toPhone: string;
  messageType: "template" | "freeform";
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: Array<{ type: "text"; text: string }>;
  textBody?: string;
}): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Provjera environment variables
  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      status: "ERROR",
      errorCode: "NOT_CONFIGURED",
      errorMessage:
        "WhatsApp Business API nije konfigurisan. Postavite WHATSAPP_ACCESS_TOKEN i WHATSAPP_PHONE_NUMBER_ID u .env.local ili na Vercel-u.",
    };
  }

  const cleanTo = options.toPhone.replace(/[^0-9]/g, "");

  // 2. Kreiranje Meta Graph API payload-a
  let payload: Record<string, any>;

  if (options.messageType === "template") {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "template",
      template: {
        name: options.templateName || "website_outreach_v1",
        language: {
          code: options.templateLanguage || "bs",
        },
        components: [
          {
            type: "body",
            parameters: options.templateParameters || [],
          },
        ],
      },
    };
  } else {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "text",
      text: {
        preview_url: true,
        body: options.textBody || "",
      },
    };
  }

  // 3. Slanje zahtjeva na Meta Graph API
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errObj = data.error || {};
      const errorCode = String(errObj.code || response.status);
      const errorMessage =
        errObj.message || errObj.error_user_msg || "Meta WhatsApp API greška";

      // Specifične poruke za uobičajene Meta statuse
      if (errorCode === "190" || errorMessage.toLowerCase().includes("access token")) {
        return {
          success: false,
          status: "ERROR",
          errorCode: "AUTH_FAILED",
          errorMessage: "WhatsApp authentication failed. Token je nevažeći ili je istekao.",
        };
      }

      if (errorCode === "132000" || errorMessage.toLowerCase().includes("template")) {
        return {
          success: false,
          status: "ERROR",
          errorCode: "TEMPLATE_ERROR",
          errorMessage: `WhatsApp template '${options.templateName}' is not approved or language code is invalid in Meta Business Manager.`,
        };
      }

      if (errorCode === "131026" || errorMessage.toLowerCase().includes("undeliverable")) {
        return {
          success: false,
          status: "ERROR",
          errorCode: "UNDELIVERABLE",
          errorMessage:
            "Broj telefona ne postoji na WhatsApp-u ili primalac ne može primiti poruku.",
        };
      }

      return {
        success: false,
        status: "ERROR",
        errorCode,
        errorMessage,
      };
    }

    const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    return {
      success: true,
      status: "SENT",
      messageId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "ERROR",
      errorCode: "NETWORK_ERROR",
      errorMessage: `Greška u mrežnoj komunikaciji sa WhatsApp API-jem: ${errorMsg}`,
    };
  }
}
