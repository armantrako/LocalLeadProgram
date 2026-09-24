import type { Lead, SearchParamsInput } from "./types";

/**
 * Primjenjuje filtere za ocjenu, recenzije i status web stranice na stvarne rezultate.
 */
export function applyFilters(leads: Lead[], params: SearchParamsInput): Lead[] {
  return leads.filter((lead) => {
    // Min rating provjera
    if (params.minRating > 0) {
      if (lead.rating === null || typeof lead.rating !== "number" || lead.rating < params.minRating) {
        return false;
      }
    }

    // Min reviews provjera
    if (params.minReviews > 0) {
      if (lead.reviewCount === null || typeof lead.reviewCount !== "number" || lead.reviewCount < params.minReviews) {
        return false;
      }
    }

    // Website filter
    if (params.websiteFilter === "no_website" && lead.website) return false;
    if (params.websiteFilter === "has_website" && !lead.website) return false;

    return true;
  });
}
