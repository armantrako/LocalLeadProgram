/**
 * Geografska validacija za Lead Finder.
 *
 * Kombinuje stvarne koordinate (Haversine udaljenost), podatke o locality/postal_code
 * iz addressComponents i analizu formatirane adrese.
 *
 * VAŽNO: Ne zahtijeva da tekst adrese doslovno sadrži naziv grada (jer Google često
 * vraća Plus kodove poput "X5RH+W3P, Branilaca Bosne", nazive naselja poput "Donje Moštre",
 * ili samo naziv ulice/ceste poput "PC96" ili "R443").
 *
 * Ako je biznis unutar fizičkog radijusa grada i podaci ne ukazuju na drugi udaljeni
 * grad/opštinu, biznis se smatra validnim lokalnim biznisom.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ResolvedCity {
  name: string;
  normalizedName: string;
  center: Coordinates;
  radiusKm: number;
  rectangle: {
    low: Coordinates;
    high: Coordinates;
  };
  locality?: string;
  postalCode?: string;
}

/**
 * Normalizuje tekst: mala slova, uklanja dijakritike (č, ć, š, ž, đ) i višestruke razmake.
 */
export function normalizeText(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Računa zračnu udaljenost između dvije tačke na Zemlji u kilometrima (Haversine formula).
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Poluprečnik Zemlje u km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface PlaceGeoData {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: Coordinates;
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
}

export interface GeoValidationResult {
  isValid: boolean;
  distanceKm: number;
  reason?: string;
}

/**
 * Lista većih/poznatih gradova i susjednih opština u BiH koji se mogu pojaviti
 * kao neželjeni prelivi kada Google proširi pretragu.
 */
const DISTINCT_MUNICIPALITIES = [
  "sarajevo", "mostar", "zenica", "tuzla", "banja luka", "bihac",
  "travnik", "vitez", "kakanj", "ilijas", "breza", "visoko",
  "bugojno", "jajce", "tesanj", "doboj", "brcko", "bijeljina",
  "siroki brijeg", "trebinje", "konjic", "jablanica", "capljina",
  "gorazde", "foca", "prijedor", "gradiska", "derventa", "livno",
  "tomislavgrad", "prozor", "zepce", "zavidovici", "maglaj", "gracanica"
];

/**
 * Validira da li Google Place rezultat zaista pripada traženom gradu.
 *
 * Koristi kombinaciju koordinata i adrese:
 * 1. Ako koordinate postoje, računa se Haversine udaljenost od centra grada.
 * 2. Ako je udaljenost veća od dozvoljenog radijusa grada -> ODBACI.
 * 3. Ako je unutar radijusa, provjerava se da li adresa ili locality eksplicitno
 *    označavaju DRUGI, suprotni grad/opštinu (npr. Mostar, Sarajevo, Travnik, Kakanj
 *    kada se traži Visoko).
 * 4. NE zahtijeva se doslovno postojanje naziva grada u formattedAddress, jer Google
 *    često vraća Plus kodove, nazive lokalnih naselja ili samo ulice/ceste.
 */
export function validatePlaceGeo(
  place: PlaceGeoData,
  city: ResolvedCity
): GeoValidationResult {
  // Ako Google nije vratio koordinate (rijetko za Places API New)
  if (
    !place.location ||
    typeof place.location.latitude !== "number" ||
    typeof place.location.longitude !== "number"
  ) {
    const normAddress = normalizeText(place.formattedAddress || "");
    if (normAddress.includes(city.normalizedName)) {
      return { isValid: true, distanceKm: 0 };
    }
    return {
      isValid: false,
      distanceKm: 999,
      reason: "Nedostaju geografske koordinate, a adresa ne sadrži naziv grada",
    };
  }

  const distance = haversineDistanceKm(
    city.center.latitude,
    city.center.longitude,
    place.location.latitude,
    place.location.longitude
  );

  // 1. Primarni filter: stvarna fizička udaljenost mora biti unutar radijusa grada
  if (distance > city.radiusKm) {
    return {
      isValid: false,
      distanceKm: distance,
      reason: `Udaljenost ${distance.toFixed(1)} km premašuje radijus grada (${city.radiusKm.toFixed(1)} km)`,
    };
  }

  // 2. Provjera eksplicitnog spominjanja DRUGE opštine/grada
  // Ako je unutar radijusa, ali locality ili formattedAddress eksplicitno navodi
  // drugi veći grad koji NIJE traženi grad (npr. na rubu opštine Kakanj/Visoko ili Vitez/Travnik)
  const normAddress = normalizeText(place.formattedAddress || "");
  const localityComp = place.addressComponents?.find(
    (c) => c.types?.includes("locality") || c.types?.includes("postal_town")
  );
  const normLocality = localityComp?.longText
    ? normalizeText(localityComp.longText)
    : "";

  // Provjeri da li locality ili adresa eksplicitno sadrže neki drugi grad sa liste
  for (const municipality of DISTINCT_MUNICIPALITIES) {
    // Preskoči ako je to zapravo traženi grad
    if (
      municipality === city.normalizedName ||
      city.normalizedName.includes(municipality) ||
      municipality.includes(city.normalizedName)
    ) {
      continue;
    }

    // Ako locality eksplicitno glasi na drugu opštinu (npr. locality: "Kakanj" pri pretrazi Visokog)
    if (normLocality === municipality) {
      return {
        isValid: false,
        distanceKm: distance,
        reason: `Locality '${localityComp?.longText}' pripada drugoj opštini (${municipality})`,
      };
    }

    // Ako u adresi eksplicitno stoji drugi grad (npr. "Ilijaš 71380" ili "Kakanj, Bosnia"),
    // a traženi grad se uopšte ne spominje:
    // Provjeravamo samo ako je udaljenost > 3.0 km (da ne odbacimo naziv ulice u centru)
    if (distance > 3.0) {
      const regex = new RegExp(`\\b${municipality}\\b`, "i");
      if (regex.test(normAddress) && !regex.test(city.normalizedName)) {
        // Dodatna provjera: ako adresa NE sadrži traženi grad, a sadrži drugu opštinu
        if (!normAddress.includes(city.normalizedName)) {
          return {
            isValid: false,
            distanceKm: distance,
            reason: `Adresa '${place.formattedAddress}' ukazuje na opštinu ${municipality}`,
          };
        }
      }
    }
  }

  // Biznis je fizički unutar radijusa grada i nema kontradikcija s drugim gradovima -> VALIDAN!
  return { isValid: true, distanceKm: distance };
}
