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

export interface CategoryOption {
  value: Category;
  label: string;
  icon: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "Restaurants", label: "Restorani i pizzerije", icon: "🍽️" },
  { value: "Cafes", label: "Kafići i barovi", icon: "☕" },
  { value: "Hotels", label: "Hoteli i smještaj", icon: "🏨" },
  { value: "Motels", label: "Moteli i prenoćišta", icon: "🛏️" },
  { value: "Auto dealerships", label: "Auto saloni (prodaja vozila)", icon: "🚗" },
  { value: "Auto services", label: "Autoservisi i vulkanizeri", icon: "🔧" },
  { value: "Wedding venues", label: "Svadbeni saloni i sale", icon: "💍" },
  { value: "Hair salons", label: "Frizerski saloni i barberi", icon: "✂️" },
  { value: "Beauty salons", label: "Kozmetički saloni i saloni ljepote", icon: "💅" },
  { value: "Dentists", label: "Stomatološke ordinacije", icon: "🦷" },
  { value: "Gyms", label: "Teretane i fitnes centri", icon: "🏋️" },
];
