import type { AppSettings, Lead, WhatsAppTemplate } from "../types";

export interface GeneratedMessageResult {
  fullText: string;
  templateName: string;
  variables: Record<string, string>;
  componentParameters: Array<{ type: "text"; text: string }>;
  isFollowup: boolean;
}

/**
 * Prečišćava naziv biznisa za prirodniji izgled u poruci (uklanja d.o.o., s.p., navodnike, itd.)
 */
export function cleanBusinessNameForChat(rawName: string): string {
  return rawName
    .replace(/\b(d\.?o\.?o\.?|s\.?p\.?|s\.?u\.?r\.?|j\.?p\.?)\b/gi, "")
    .replace(/["'„”«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generiše personalizovanu poruku i varijable za WhatsApp template ili free-form slanje.
 */
export function generateOutreachMessage(
  lead: Lead,
  settings: AppSettings,
  template?: WhatsAppTemplate,
  isFollowup = false,
  followupNumber = 1
): GeneratedMessageResult {
  const businessName = cleanBusinessNameForChat(lead.name);
  const city = lead.city || "vašem gradu";
  const category = lead.category || "vašoj djelatnosti";
  const demoUrl = settings.demoUrl || "https://restoran-demo.ba";

  if (isFollowup) {
    const followupTemplateName = "website_followup_v1";
    const variables: Record<string, string> = {
      business_name: businessName,
      demo_url: demoUrl,
    };

    let fullText = "";
    if (followupNumber === 1) {
      fullText = `Pozdrav ponovo od ${settings.myName}! Samo kratko provjeravam da li ste imali priliku pogledati demo primjer za ${businessName} (${demoUrl})? Javite ako imate pitanja ili ako želite da prilagodimo dizajn vašim željama.`;
    } else {
      fullText = `Pozdrav još jednom, ${settings.myName} ovdje. Razumijem da imate dosta posla oko ${businessName}, pa vam se više neću javljati da ne smetam. Ako nekada u budućnosti budete željeli modernu web stranicu ili digitalni meni, slobodno me kontaktirajte. Srdačan pozdrav!`;
    }

    return {
      fullText,
      templateName: followupTemplateName,
      variables,
      componentParameters: [
        { type: "text", text: businessName },
        { type: "text", text: demoUrl },
      ],
      isFollowup: true,
    };
  }

  // Početna outreach poruka
  const activeTemplateName =
    template?.name || settings.activeTemplate || "website_outreach_v1";

  const variables: Record<string, string> = {
    business_name: businessName,
    city: city,
    category: category,
    demo_url: demoUrl,
  };

  let fullText = "";
  if (template?.body) {
    fullText = template.body
      .replace(/\{\{business_name\}\}/g, businessName)
      .replace(/\{\{city\}\}/g, city)
      .replace(/\{\{category\}\}/g, category)
      .replace(/\{\{demo_url\}\}/g, demoUrl);
  } else {
    fullText = `Pozdrav, javio sam se zbog ${businessName} iz grada ${city}. Vidio sam da imate odlične ocjene u kategoriji ${category}, ali nisam pronašao vašu modernu web stranicu. Napravio sam kratki primjer kako bi online prezentacija mogla izgledati: ${demoUrl}. Ako želite, mogu vam poslati detalje.`;
  }

  // Komponente parametara u tačnom redoslijedu za WhatsApp API
  const componentParameters = [
    { type: "text" as const, text: businessName },
    { type: "text" as const, text: city },
    { type: "text" as const, text: category },
    { type: "text" as const, text: demoUrl },
  ];

  return {
    fullText,
    templateName: activeTemplateName,
    variables,
    componentParameters,
    isFollowup: false,
  };
}
