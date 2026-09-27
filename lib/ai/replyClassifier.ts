import type { AppSettings, ReplyClassification } from "../types";

export interface ClassificationResult {
  classification: ReplyClassification;
  confidence: number;
  isStopRequest: boolean;
  suggestedResponse?: string;
  reason: string;
}

/**
 * Detaljna analiza pristiglog WhatsApp odgovora na bosanskom jeziku.
 */
export function classifyIncomingReply(
  replyText: string,
  settings: AppSettings
): ClassificationResult {
  const text = (replyText || "").toLowerCase().trim();

  // 1. OBAVEZNA PROVJERA ZA "STOP" / "DO NOT CONTACT"
  // Ako osoba odgovori: "Ne", "Ne treba", "Nemojte više", "Stop", itd.
  const stopPatterns = [
    /\bstop\b/,
    /\bne\s*treba\b/,
    /\bnemojte\s*vise\b/,
    /\bne\s*zelim\b/,
    /\bprestanite\b/,
    /\bblok\b/,
    /\bodjebi\b/,
    /\bgonite\s*se\b/,
    /\bobrisi(te)?\s*broj\b/,
    /\bmaknite\s*me\b/,
    /\bodjav(i|ite)\b/,
    /\bnepozeljn(o|i)\b/,
  ];

  for (const pattern of stopPatterns) {
    if (pattern.test(text)) {
      return {
        classification: "STOP",
        confidence: 0.98,
        isStopRequest: true,
        reason: "Klijent je eksplicitno zatražio prekid komunikacije (STOP)",
      };
    }
  }

  // 2. Provjera za NOT_INTERESTED
  const notInterestedPatterns = [
    /\bne\s*hvala\b/,
    /\bnismo\s*zainteresovani\b/,
    /\bnisam\s*zainteresovan\b/,
    /\bimamo\s*vec\s*(web|stranicu|programera)\b/,
    /\bvec\s*imamo\b/,
    /\bne\s*odgovara\b/,
    /\bne\s*bismo\b/,
  ];

  // Tačno samo "ne" ili "ne hvala"
  if (text === "ne" || text === "ne." || text === "ne!") {
    return {
      classification: "NOT_INTERESTED",
      confidence: 0.95,
      isStopRequest: false,
      reason: "Korisnik je kratko odgovorio 'Ne'",
      suggestedResponse:
        "Razumijem u potpunosti. Hvala na odgovoru i srdačan pozdrav!",
    };
  }

  for (const pattern of notInterestedPatterns) {
    if (pattern.test(text)) {
      return {
        classification: "NOT_INTERESTED",
        confidence: 0.95,
        isStopRequest: false,
        reason: "Klijent je naveo da nije zainteresovan ili već ima rješenje",
        suggestedResponse:
          "Razumijem u potpunosti, hvala na javljanju. Želim vam puno uspjeha u poslovanju!",
      };
    }
  }

  // 3. Provjera za PRICE_REQUEST (Cijena)
  const pricePatterns = [
    /\bcijen(a|e|u)\b/,
    /\bkoliko\s*kosta\b/,
    /\bkoja\s*je\s*cijena\b/,
    /\bkoliko\s*to\s*kosta\b/,
    /\bcjenovnik\b/,
    /\bponud(a|u)\b/,
    /\btarif(a|e)\b/,
    /\bkm\b/,
    /\beur(a|o)?\b/,
  ];

  for (const pattern of pricePatterns) {
    if (pattern.test(text)) {
      return {
        classification: "PRICE_REQUEST",
        confidence: 0.9,
        isStopRequest: false,
        reason: "Klijent se raspituje za cijenu izrade i održavanja",
        suggestedResponse: `Pozdrav! Osnovni paket za kompletnu izradu moderne stranice iznosi ${settings.basePrice} (uključuje moderan dizajn, mobilnu prilagodbu, SEO za Google i WhatsApp integraciju). Mjesečno održavanje i hosting je ${settings.maintenancePrice}. Mogu li vam poslati kratku ponudu sa detaljima?`,
      };
    }
  }

  // 4. Provjera za INTERESTED (Zainteresovan / Traži link / Detalje)
  const interestedPatterns = [
    /\bposalji(te)?\b/,
    /\bmoze\b/,
    /\bmoze\s*link\b/,
    /\bzanima\s*me\b/,
    /\bzainteresovan(i)?\b/,
    /\bdajte\s*link\b/,
    /\bdjeste\s*link\b/,
    /\bda\s*vidim\b/,
    /\bsta\s*nudite\b/,
    /\bkako\s*funkcionise\b/,
    /\bzelim\b/,
    /\bhocu\b/,
    /\bsvaka\s*cast\b/,
    /\bodlicno\b/,
    /\bsvida\s*mi\s*se\b/,
  ];

  for (const pattern of interestedPatterns) {
    if (pattern.test(text)) {
      return {
        classification: "INTERESTED",
        confidence: 0.92,
        isStopRequest: false,
        reason: "Klijent je pokazao interesovanje ili zatražio primjer/link",
        suggestedResponse: `Drago mi je što vas zanima! Ovdje možete pogledati funkcionalni demo primjer: ${settings.demoUrl}. Za vaš biznis bismo prilagodili boje, logo, slike vaših artikala/usluga i kontakt podatke. Kada vam najviše odgovara da se kratko čujemo telefonom za dogovor?`,
      };
    }
  }

  // 5. Provjera za LATER (Kasnije)
  const laterPatterns = [
    /\bkasnije\b/,
    /\biduce\s*(sedmice|nedjelje)\b/,
    /\bsutra\b/,
    /\bna\s*putu\s*sam\b/,
    /\bposlije\b/,
    /\bjavite\s*se\b/,
    /\bzovite\b/,
    /\bguzva\b/,
  ];

  for (const pattern of laterPatterns) {
    if (pattern.test(text)) {
      return {
        classification: "LATER",
        confidence: 0.85,
        isStopRequest: false,
        reason: "Klijent trenutno nema vremena i traži kontakt kasnije",
        suggestedResponse:
          "Hvala na povratnoj informaciji! Zabilježio sam da vas kontaktiram malo kasnije. Ugodan dan!",
      };
    }
  }

  // 6. QUESTION (Pitanje)
  if (text.includes("?") || text.startsWith("ko ") || text.startsWith("sta ") || text.startsWith("gdje ")) {
    return {
      classification: "QUESTION",
      confidence: 0.8,
      isStopRequest: false,
      reason: "Klijent je postavio pitanje o uslugama ili agenciji",
      suggestedResponse: `Pozdrav! Ja sam ${settings.myName} iz ${settings.agencyName}. ${settings.serviceDescription}. Slobodno recite šta vas konkretno zanima pa vam rado pojasnim!`,
    };
  }

  return {
    classification: "UNKNOWN",
    confidence: 0.5,
    isStopRequest: false,
    reason: "Odgovor nije prepoznat automatskim obrascima, potreban pregled",
    suggestedResponse: `Pozdrav! Hvala vam na poruci. Kako vam mogu dodatno pomoći u vezi web stranice?`,
  };
}
