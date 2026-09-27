export interface NormalizedPhoneResult {
  raw: string;
  e164: string; // npr. "38761123456"
  formatted: string; // npr. "+387 61 123 456"
  countryCode: string; // "387"
  isBiH: boolean;
  type: "mobile" | "landline" | "unknown" | "invalid";
  isValid: boolean;
  reason?: string;
}

/**
 * Normalizuje broj telefona u standardni format (E.164 bez + znaka za WhatsApp API).
 */
export function normalizePhoneNumber(
  rawPhone: string | null | undefined
): NormalizedPhoneResult {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      raw: "",
      e164: "",
      formatted: "",
      countryCode: "",
      isBiH: false,
      type: "invalid",
      isValid: false,
      reason: "Broj telefona nije unesen",
    };
  }

  const raw = rawPhone.trim();
  // Ukloni sve osim cifara i početnog plusa
  let cleaned = raw.replace(/[^0-9+]/g, "");

  // Obradi vodeće nule (00387 -> +387)
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Ako počinje sa lokalnom nulom za BiH (npr. 061, 062, 032, 033...)
  if (cleaned.startsWith("0") && !cleaned.startsWith("+")) {
    cleaned = "+387" + cleaned.slice(1);
  }

  // Ako nema plus, a počinje sa 387
  if (cleaned.startsWith("387") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  // Ako nema pozivni broj uopšte (npr. 61123456)
  if (!cleaned.startsWith("+") && cleaned.length >= 8 && cleaned.length <= 9) {
    if (cleaned.startsWith("6")) {
      cleaned = "+387" + cleaned;
    }
  }

  const digitsOnly = cleaned.replace(/[^0-9]/g, "");

  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return {
      raw,
      e164: digitsOnly,
      formatted: raw,
      countryCode: "",
      isBiH: false,
      type: "invalid",
      isValid: false,
      reason: `Nevažeća dužina broja telefona (${digitsOnly.length} cifara)`,
    };
  }

  const isBiH = digitsOnly.startsWith("387");

  if (isBiH) {
    // 387 6x... je mobilni
    const afterCountry = digitsOnly.slice(3);
    const firstDigit = afterCountry.charAt(0);

    if (firstDigit === "6") {
      // Mobilni BiH: 387 61 123 456
      const prefix = afterCountry.slice(0, 2); // 61, 62, 63, 60...
      const rest = afterCountry.slice(2);
      return {
        raw,
        e164: digitsOnly,
        formatted: `+387 ${prefix} ${rest.slice(0, 3)} ${rest.slice(3)}`.trim(),
        countryCode: "387",
        isBiH: true,
        type: "mobile",
        isValid: true,
      };
    } else {
      // Fiksni BiH: 387 32 733 333
      const areaCode = afterCountry.slice(0, 2); // 32, 33, 30...
      const rest = afterCountry.slice(2);
      return {
        raw,
        e164: digitsOnly,
        formatted: `+387 ${areaCode} ${rest.slice(0, 3)} ${rest.slice(3)}`.trim(),
        countryCode: "387",
        isBiH: true,
        type: "landline",
        isValid: true,
        reason:
          "Broj je fiksna linija (landline). WhatsApp poruke obično uspijevaju samo na mobilnim brojevima ili verificiranim WhatsApp Business linijama.",
      };
    }
  }

  // Međunarodni broj
  return {
    raw,
    e164: digitsOnly,
    formatted: `+${digitsOnly}`,
    countryCode: digitsOnly.slice(0, 3),
    isBiH: false,
    type: "unknown",
    isValid: true,
  };
}
