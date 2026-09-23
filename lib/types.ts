export type WebsiteFilter = "any" | "no_website" | "has_website";

export type SortKey = "score" | "rating" | "reviews" | "name";

export interface SearchParamsInput {
  city: string;
  category: string;
  minRating: number;
  minReviews: number;
  websiteFilter: WebsiteFilter;
  pageToken?: string;
}

export interface Lead {
  id: string;
  name: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  leadScore: number;
  scoreReasons: string[];
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  distanceKm?: number | null;
  businessStatus?: string | null;
  types?: string[];
}

export interface LeadsFetchResult {
  leads: Lead[];
  nextPageToken: string | null;
  resolvedCity?: {
    name: string;
    radiusKm: number;
  };
  totalBeforeFilter?: number;
  totalAfterGeoFilter?: number;
}

export const CATEGORIES = [
  "Restaurants",
  "Hotels",
  "Motels",
  "Auto dealerships",
  "Auto services",
  "Wedding venues",
  "Cafes",
  "Hair salons",
  "Beauty salons",
  "Dentists",
  "Gyms",
] as const;

export type Category = (typeof CATEGORIES)[number];
