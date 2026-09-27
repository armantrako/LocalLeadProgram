export type WebsiteFilter = "any" | "no_website" | "has_website";

export type SortKey = "score" | "rating" | "reviews" | "name" | "status";

export interface SearchParamsInput {
  city: string;
  category: string;
  minRating: number;
  minReviews: number;
  websiteFilter: WebsiteFilter;
  pageToken?: string;
}

export type LeadStatus =
  | "NEW"
  | "ANALYZING"
  | "MESSAGE_READY"
  | "READY_TO_SEND"
  | "SENT"
  | "REPLIED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "FOLLOW_UP"
  | "DO_NOT_CONTACT"
  | "ERROR"
  | "NOT_ELIGIBLE";

export type ReplyClassification =
  | "INTERESTED"
  | "PRICE_REQUEST"
  | "QUESTION"
  | "LATER"
  | "NOT_INTERESTED"
  | "STOP"
  | "UNKNOWN";

export interface BusinessAnalysis {
  whyIdealClient: string;
  hasWebsite: boolean;
  websiteAnalysis: string;
  onlinePresenceQuality: "poor" | "moderate" | "good" | "excellent";
  websitePotential: string;
  bestSalesAngle: string;
  analyzedAt: string;
}

export interface OutreachMessage {
  id: string;
  leadId: string;
  direction: "outgoing" | "incoming";
  text: string;
  templateName?: string;
  templateVariables?: Record<string, string>;
  whatsappMessageId?: string;
  status: "queued" | "sending" | "sent" | "delivered" | "read" | "failed";
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
  aiClassification?: ReplyClassification;
  aiSuggestedResponse?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY";
  header?: string;
  body: string;
  variables: string[];
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export interface AppSettings {
  // AI Sales Context
  myName: string;
  agencyName: string;
  serviceDescription: string;
  basePrice: string;
  maintenancePrice: string;
  demoUrl: string;
  phone: string;
  email: string;
  targetCities: string[];
  messageTone: "professional" | "friendly" | "direct";

  // WhatsApp Configuration & Policy
  whatsappMessageType: "template" | "freeform";
  activeTemplate: string;

  // Automation & Limits
  autoOutreachEnabled: boolean;
  maxDailyOutreach: number;
  maxHourlyOutreach: number;
  minDelaySeconds: number;
  maxFollowups: number;
  followupDelayDays: number;

  // AI Provider
  aiProvider: "builtin" | "openai" | "gemini";
  aiModel: string;
}

export type AuditAction =
  | "AI_MESSAGE_GENERATED"
  | "AI_ANALYSIS_COMPLETED"
  | "WHATSAPP_SEND_ATTEMPT"
  | "WHATSAPP_SENT"
  | "WHATSAPP_FAILED"
  | "REPLY_RECEIVED"
  | "REPLY_CLASSIFIED"
  | "FOLLOWUP_SCHEDULED"
  | "FOLLOWUP_SENT"
  | "DO_NOT_CONTACT"
  | "STATUS_CHANGED"
  | "ELIGIBILITY_CHECK";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  leadId: string;
  businessName: string;
  action: AuditAction;
  status: "success" | "warning" | "error" | "info";
  channel: "whatsapp" | "system" | "ai";
  messageId?: string;
  error?: string;
  details?: string;
  source: "ai" | "manual" | "webhook" | "cron";
}

export interface OutreachStats {
  messagesSent: number;
  messagesDelivered: number;
  replies: number;
  interested: number;
  notInterested: number;
  followups: number;
  errors: number;
  potentialDeals: number;
  won: number;
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

  // Outreach & CRM Fields
  status?: LeadStatus;
  city?: string;
  category?: string;
  analysis?: BusinessAnalysis | null;
  generatedMessage?: string | null;
  selectedTemplate?: string | null;
  eligibility?: {
    isEligible: boolean;
    normalizedPhone: string | null;
    phoneType: "mobile" | "landline" | "invalid";
    reason?: string;
  } | null;
  lastContactAt?: string | null;
  nextFollowupAt?: string | null;
  followupCount?: number;
  conversation?: OutreachMessage[];
  doNotContact?: boolean;
  doNotContactReason?: string | null;
  lastError?: {
    code?: string;
    message: string;
    timestamp: string;
  } | null;
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
