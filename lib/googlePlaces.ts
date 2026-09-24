import { calculateLeadScore } from "./leadScore";
import { applyFilters } from "./filters";
import {
  haversineDistanceKm,
  normalizeText,
  validatePlaceGeo,
  type PlaceGeoData,
  type ResolvedCity,
} from "./geoValidation";
import type { Lead, LeadsFetchResult, SearchParamsInput } from "./types";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.businessStatus",
  "places.types",
  "places.addressComponents",
  "nextPageToken",
].join(",");

/**
 * Optimizovane varijacije upita za maksimalnu pokrivenost uz kontrolisanu potrošnju API-ja.
 * Kombinacija engleskih i domaćih termina garantuje pronalazak lokalnih biznisa.
 */
const CATEGORY_QUERY_VARIATIONS: Record<string, string[]> = {
  Restaurants: ["restaurants", "pizzeria", "grill ćevabdžinica"],
  Hotels: ["hotels", "hotel accommodation", "prenoćište apartmani"],
  Motels: ["motels", "motel prenoćište"],
  "Auto dealerships": ["auto dealership", "car dealership auto salon", "prodaja vozila"],
  "Auto services": ["auto service", "auto repair autoservis", "vulkanizer"],
  "Wedding venues": ["wedding venues", "svadbeni salon", "sala za vjenčanja"],
  Cafes: ["cafes", "coffee shop caffe bar", "kafana"],
  "Hair salons": ["hair salon", "frizerski salon", "barber shop"],
  "Beauty salons": ["beauty salon", "kozmetički salon", "salon ljepote"],
  Dentists: ["dentist dental clinic", "stomatolog ordinacija"],
  Gyms: ["gym fitness center", "teretana klub"],
};

// Broj stranica po varijaciji (1 stranica = ~20 rezultata po varijaciji)
const MAX_PAGES_PER_QUERY = 1;

interface GooglePlace extends PlaceGeoData {
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
}

interface SearchTextResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * In-memory keš za geografske koordinate gradova radi smanjenja nepotrebnih API poziva
 */
const cityCache = new Map<string, ResolvedCity>();

/**
 * In-memory sesijski keš za pretrage (5 minuta) radi uštede API poziva
 */
const searchResultsCache = new Map<string, { data: LeadsFetchResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Dinamičko određivanje lokacije grada pomoću Google Places API (New).
 */
export async function resolveCity(
  apiKey: string,
  cityInput: string
): Promise<ResolvedCity> {
  const normKey = normalizeText(cityInput);
  if (cityCache.has(normKey)) {
    return cityCache.get(normKey)!;
  }

  const query = cityInput.toLowerCase().includes("bosnia")
    ? cityInput.trim()
    : `${cityInput.trim()}, Bosnia and Herzegovina`;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.viewport,places.addressComponents",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Greška pri pronalaženju lokacije grada '${cityInput}': ${errText}`);
  }

  const data = (await response.json()) as SearchTextResponse;
  const place = data.places?.[0];

  if (!place || !place.location) {
    throw new Error(`Grad '${cityInput}' nije pronađen na mapi.`);
  }

  const center = place.location;
  const viewport = (place as any).viewport;

  let radiusKm = 8.0;
  if (viewport && center) {
    const dCorner = haversineDistanceKm(
      center.latitude,
      center.longitude,
      viewport.high.latitude,
      viewport.high.longitude
    );
    // Sigurnosni faktor (1.35x) za industrijske i prigradske zone (min 6km, max 22km)
    radiusKm = Math.min(22.0, Math.max(6.0, dCorner * 1.35));
  }

  const latDelta = radiusKm / 111.0;
  const lonDelta = radiusKm / (111.0 * Math.cos((center.latitude * Math.PI) / 180));

  const rectangle = {
    low: {
      latitude: center.latitude - latDelta,
      longitude: center.longitude - lonDelta,
    },
    high: {
      latitude: center.latitude + latDelta,
      longitude: center.longitude + lonDelta,
    },
  };

  const locality = place.addressComponents?.find(
    (c) => c.types?.includes("locality") || c.types?.includes("postal_town")
  )?.longText;

  const postalCode = place.addressComponents?.find((c) =>
    c.types?.includes("postal_code")
  )?.longText;

  const resolved: ResolvedCity = {
    name: place.displayName?.text || cityInput.trim(),
    normalizedName: normalizeText(place.displayName?.text || cityInput),
    center,
    radiusKm,
    rectangle,
    locality,
    postalCode,
  };

  cityCache.set(normKey, resolved);
  return resolved;
}

/**
 * Poziv Places API (New) Text Search za jedan page.
 */
async function fetchSearchTextPage(
  apiKey: string,
  requestBody: Record<string, any>
): Promise<SearchTextResponse> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.warn(`[GooglePlaces] SearchText error status ${response.status}: ${errBody}`);
    throw new Error(`Google Places API error (${response.status}): ${errBody}`);
  }

  return (await response.json()) as SearchTextResponse;
}

/**
 * Dohvata rezultate za jednu varijaciju upita.
 */
async function fetchPagesForVariation(
  apiKey: string,
  initialBody: Record<string, any>
): Promise<{ places: GooglePlace[]; error?: string }> {
  const collected: GooglePlace[] = [];
  let pageToken: string | undefined;
  let pagesFetched = 0;
  let lastError: string | undefined;

  do {
    try {
      const body = pageToken ? { ...initialBody, pageToken } : initialBody;
      const data = await fetchSearchTextPage(apiKey, body);

      if (data.places && data.places.length > 0) {
        collected.push(...data.places);
      }

      pageToken = data.nextPageToken;
      pagesFetched++;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[GooglePlaces] Query nije uspio (${initialBody.textQuery}):`,
        lastError
      );
      break;
    }
  } while (pageToken && pagesFetched < MAX_PAGES_PER_QUERY);

  return { places: collected, error: lastError };
}

/**
 * Glavna funkcija za pretragu leadova sa strogom geografskom validacijom.
 */
export async function fetchLeadsFromGoogle(
  params: SearchParamsInput
): Promise<LeadsFetchResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Google Places API ključ nije podešen. Postavite GOOGLE_MAPS_API_KEY u environment variables."
    );
  }

  // Provjeri sesijski keš
  const cacheKey = `${normalizeText(params.city)}:${normalizeText(params.category)}:${params.minRating}:${params.minReviews}:${params.websiteFilter}`;
  const cached = searchResultsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Dinamički razriješi lokaciju i granice grada
  const city = await resolveCity(apiKey, params.city);

  // 2. Kreiraj varijacije upita za zadanu kategoriju
  const variations =
    CATEGORY_QUERY_VARIATIONS[params.category] ?? [params.category];

  // 3. Pošalji Google Places API upite sa locationRestriction (ograničenje na područje grada)
  const queryPromises = variations.map((variation) => {
    const textQuery = `${variation} in ${city.name}, Bosnia and Herzegovina`;
    const initialBody = {
      textQuery,
      locationRestriction: {
        rectangle: city.rectangle,
      },
    };
    return fetchPagesForVariation(apiKey, initialBody);
  });

  const queryResults = await Promise.allSettled(queryPromises);

  // 4. Prikupi i dedupiraj po place.id
  const byId = new Map<string, GooglePlace>();
  let quotaErrorOccurred = false;
  let allQueriesFailed = true;

  for (const result of queryResults) {
    if (result.status === "fulfilled") {
      const { places, error } = result.value;
      if (error && (error.includes("429") || error.toLowerCase().includes("quota"))) {
        quotaErrorOccurred = true;
      }
      if (places.length > 0) {
        allQueriesFailed = false;
        for (const place of places) {
          if (!place.id) continue;
          if (!byId.has(place.id)) {
            byId.set(place.id, place);
          }
        }
      }
    } else {
      const reasonStr = String(result.reason);
      if (reasonStr.includes("429") || reasonStr.toLowerCase().includes("quota")) {
        quotaErrorOccurred = true;
      }
    }
  }

  // Ako su svi upiti pali zbog 429 greške kvote
  if (byId.size === 0 && quotaErrorOccurred) {
    throw new Error(
      "Google Places API (429): Dnevna kvota na vašem Google Cloud projektu je prekoračena. Povećajte 'SearchTextRequest per day' limit na Google Cloud Console (APIs & Services > Places API (New) > Quotas) ili sačekajte resetovanje."
    );
  }

  const rawCount = byId.size;

  // 5. POST-SEARCH GEOGRAFSKA VALIDACIJA (Obavezno)
  // Svaki pojedinačni biznis se testira na pripadnost traženom gradu.
  const validPlaces: Array<{ place: GooglePlace; distanceKm: number }> = [];

  for (const place of byId.values()) {
    // Preskoči trajno zatvorene biznise
    if (place.businessStatus === "CLOSED_PERMANENTLY") {
      continue;
    }

    const geoResult = validatePlaceGeo(place, city);
    if (!geoResult.isValid) {
      console.log(
        `[GeoFilter] ODBAČENO: "${place.displayName?.text}" (${place.formattedAddress}) - Razlog: ${geoResult.reason}`
      );
      continue;
    }

    validPlaces.push({ place, distanceKm: geoResult.distanceKm });
  }

  const totalAfterGeoFilter = validPlaces.length;

  // 6. Mapiranje u Lead format sa transparentnim bodovanjem
  const leads: Lead[] = validPlaces.map(({ place, distanceKm }, i) => {
    const rating = typeof place.rating === "number" ? place.rating : null;
    const reviewCount =
      typeof place.userRatingCount === "number" ? place.userRatingCount : null;
    const website = place.websiteUri ? place.websiteUri.trim() : null;
    const phone =
      place.nationalPhoneNumber || place.internationalPhoneNumber || null;
    const address = place.formattedAddress || null;

    const { score, reasons } = calculateLeadScore({
      rating,
      reviewCount,
      website,
    });

    return {
      id: place.id ?? `google-${Date.now()}-${i}`,
      name: place.displayName?.text ?? "Nije dostupno",
      rating,
      reviewCount,
      address,
      phone,
      website,
      mapsUrl: place.googleMapsUri ?? null,
      leadScore: score,
      scoreReasons: reasons,
      distanceKm: Math.round(distanceKm * 10) / 10,
      location: place.location ?? null,
      businessStatus: place.businessStatus ?? null,
      types: place.types ?? [],
    };
  });

  // 7. Primjena korisničkih filtera (minRating, minReviews, websiteFilter)
  const filteredLeads = applyFilters(leads, params);

  const finalResult: LeadsFetchResult = {
    leads: filteredLeads,
    nextPageToken: null,
    resolvedCity: {
      name: city.name,
      radiusKm: Math.round(city.radiusKm * 10) / 10,
    },
    totalBeforeFilter: rawCount,
    totalAfterGeoFilter,
  };

  // Spremi u sesijski keš
  searchResultsCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });

  return finalResult;
}
