import fs from "fs";
import path from "path";
import { normalizePhoneNumber } from "../whatsapp/phoneUtils";
import type {
  AppSettings,
  AuditLogEntry,
  Lead,
  OutreachStats,
  WhatsAppTemplate,
} from "../types";

export const DEFAULT_SETTINGS: AppSettings = {
  myName: "Arman Trako",
  agencyName: "Trako Web Studio",
  serviceDescription:
    "Izrada modernih, brzih web stranica i digitalnih jelovnika sa SEO optimizacijom za lokalne biznise",
  basePrice: "450 KM",
  maintenancePrice: "50 KM/mjesečno",
  demoUrl: "https://restoran-demo.ba",
  phone: "+387 61 000 000",
  email: "kontakt@trakostudio.ba",
  targetCities: ["Visoko", "Travnik", "Zenica", "Sarajevo", "Mostar", "Vitez"],
  messageTone: "friendly",
  whatsappMessageType: "template",
  activeTemplate: "website_outreach_v1",
  autoOutreachEnabled: false,
  maxDailyOutreach: 20,
  maxHourlyOutreach: 5,
  minDelaySeconds: 35,
  maxFollowups: 2,
  followupDelayDays: 3,
  aiProvider: "builtin",
  aiModel: "gpt-4o-mini",
};

export const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: "website_outreach_v1",
    language: "bs",
    category: "MARKETING",
    header: "Prijedlog za web stranicu",
    body: "Pozdrav, javio sam se zbog {{business_name}} iz grada {{city}}. Vidio sam da imate odlične ocjene u kategoriji {{category}}, ali nisam pronašao vašu modernu web stranicu. Napravio sam kratki primjer kako bi online prezentacija mogla izgledati: {{demo_url}}. Ako želite, mogu vam poslati detalje.",
    variables: ["business_name", "city", "category", "demo_url"],
    status: "APPROVED",
  },
  {
    name: "website_followup_v1",
    language: "bs",
    category: "MARKETING",
    header: "Kratak podsjetnik",
    body: "Pozdrav ponovo od Armana! Samo kratko provjeravam da li ste imali priliku pogledati demo primjer za {{business_name}} ({{demo_url}})? Javite ako imate pitanja ili želite besplatne konsultacije.",
    variables: ["business_name", "demo_url"],
    status: "APPROVED",
  },
];

interface DataStoreSchema {
  settings: AppSettings;
  templates: WhatsAppTemplate[];
  leads: Record<string, Lead>;
  doNotContactList: Record<
    string,
    { phone: string; businessName?: string; reason: string; timestamp: string }
  >;
  auditLogs: AuditLogEntry[];
}

// In-memory cache
let inMemoryStore: DataStoreSchema | null = null;

function resolveDbFilePath(): string {
  // Ako je definisan poseban DATA_PATH
  if (process.env.DATA_PATH) {
    return process.env.DATA_PATH;
  }

  // Provjeri lokalni folder ./data
  const localDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "db.json");
  } catch {
    // Ako je readonly filesystem (npr. na nekim serverless instancama), koristi /tmp
    const tmpDir = path.join("/tmp", "lead-finder");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
      // Ignoriši ako već postoji
    }
    return path.join(tmpDir, "db.json");
  }
}

function loadStore(): DataStoreSchema {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  const filePath = resolveDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      inMemoryStore = {
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        templates:
          parsed.templates && parsed.templates.length > 0
            ? parsed.templates
            : DEFAULT_TEMPLATES,
        leads: parsed.leads || {},
        doNotContactList: parsed.doNotContactList || {},
        auditLogs: parsed.auditLogs || [],
      };
      return inMemoryStore;
    }
  } catch (err) {
    console.warn("[Store] Ne mogu pročitati db.json, koristim novi store:", err);
  }

  inMemoryStore = {
    settings: { ...DEFAULT_SETTINGS },
    templates: [...DEFAULT_TEMPLATES],
    leads: {},
    doNotContactList: {},
    auditLogs: [],
  };
  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(store: DataStoreSchema): void {
  inMemoryStore = store;
  try {
    const filePath = resolveDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Store] Greška pri pisanju u db.json:", err);
  }
}

// ==========================================
// REPOZITORIJ ZA LEAD-OVE
// ==========================================

export function getLeadById(id: string): Lead | null {
  const store = loadStore();
  return store.leads[id] || null;
}

export function getAllLeads(): Lead[] {
  const store = loadStore();
  return Object.values(store.leads);
}

export function saveLead(lead: Lead): Lead {
  const store = loadStore();
  const existing = store.leads[lead.id];
  const updated: Lead = {
    ...existing,
    ...lead,
    status: lead.status || existing?.status || "NEW",
    followupCount:
      typeof lead.followupCount === "number"
        ? lead.followupCount
        : existing?.followupCount || 0,
    conversation: lead.conversation || existing?.conversation || [],
  };

  store.leads[lead.id] = updated;
  saveStore(store);
  return updated;
}

export function saveBatchLeads(leads: Lead[]): void {
  const store = loadStore();
  for (const lead of leads) {
    const existing = store.leads[lead.id];
    store.leads[lead.id] = {
      ...existing,
      ...lead,
      status: existing?.status || lead.status || "NEW",
      followupCount: existing?.followupCount ?? lead.followupCount ?? 0,
      conversation: existing?.conversation || lead.conversation || [],
    };
  }
  saveStore(store);
}

// ==========================================
// DO NOT CONTACT LISTA
// ==========================================

export function isDoNotContact(
  phone: string | null | undefined,
  businessName?: string
): boolean {
  if (!phone) return false;
  const store = loadStore();
  const norm = normalizePhoneNumber(phone);
  const cleanPhone = norm.e164 || phone.replace(/[^0-9]/g, "");

  // Provjeri po normalizovanom E.164
  if (cleanPhone && store.doNotContactList[cleanPhone]) {
    return true;
  }

  // Provjeri po sirovim ciframa ili sufiksu
  const rawDigits = phone.replace(/[^0-9]/g, "");
  if (rawDigits && store.doNotContactList[rawDigits]) {
    return true;
  }

  for (const dncKey of Object.keys(store.doNotContactList)) {
    if (
      dncKey === cleanPhone ||
      dncKey === rawDigits ||
      (cleanPhone && (dncKey.endsWith(cleanPhone) || cleanPhone.endsWith(dncKey))) ||
      (rawDigits && (dncKey.endsWith(rawDigits) || rawDigits.endsWith(dncKey)))
    ) {
      return true;
    }
  }

  // Provjeri i po nazivu biznisa ako postoji
  if (businessName) {
    const normName = businessName.toLowerCase().trim();
    for (const dnc of Object.values(store.doNotContactList)) {
      if (dnc.businessName && dnc.businessName.toLowerCase().trim() === normName) {
        return true;
      }
    }
  }

  return false;
}

export function addToDoNotContact(
  phone: string,
  reason: string,
  businessName?: string
): void {
  const store = loadStore();
  const norm = normalizePhoneNumber(phone);
  const cleanPhone = norm.e164 || phone.replace(/[^0-9]/g, "");

  store.doNotContactList[cleanPhone] = {
    phone,
    businessName,
    reason,
    timestamp: new Date().toISOString(),
  };

  // Također sačuvaj i raw digits ako se razlikuje
  const rawDigits = phone.replace(/[^0-9]/g, "");
  if (rawDigits && rawDigits !== cleanPhone) {
    store.doNotContactList[rawDigits] = {
      phone,
      businessName,
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  // Ažuriraj sve povezane leadove na DO_NOT_CONTACT
  for (const lead of Object.values(store.leads)) {
    if (lead.phone) {
      const lNorm = normalizePhoneNumber(lead.phone);
      if (
        lNorm.e164 === cleanPhone ||
        lead.phone.replace(/[^0-9]/g, "") === cleanPhone ||
        lead.phone.replace(/[^0-9]/g, "") === rawDigits ||
        (lead.name &&
          businessName &&
          lead.name.toLowerCase().trim() === businessName.toLowerCase().trim())
      ) {
        lead.status = "DO_NOT_CONTACT";
        lead.doNotContact = true;
        lead.doNotContactReason = reason;
      }
    }
  }

  saveStore(store);
}

// ==========================================
// POSTAVKE (SETTINGS)
// ==========================================

export function getSettings(): AppSettings {
  const store = loadStore();
  return { ...DEFAULT_SETTINGS, ...store.settings };
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const store = loadStore();
  store.settings = { ...store.settings, ...partial };
  saveStore(store);
  return store.settings;
}

// ==========================================
// TEMPLATE-I
// ==========================================

export function getTemplates(): WhatsAppTemplate[] {
  const store = loadStore();
  return store.templates;
}

export function saveTemplate(template: WhatsAppTemplate): WhatsAppTemplate {
  const store = loadStore();
  const idx = store.templates.findIndex((t) => t.name === template.name);
  if (idx >= 0) {
    store.templates[idx] = template;
  } else {
    store.templates.push(template);
  }
  saveStore(store);
  return template;
}

// ==========================================
// AUDIT LOG
// ==========================================

export function logAuditEvent(
  event: Omit<AuditLogEntry, "id" | "timestamp">
): AuditLogEntry {
  const store = loadStore();
  const entry: AuditLogEntry = {
    ...event,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  store.auditLogs.unshift(entry);
  // Ograniči log na zadnjih 500 unosa
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }

  saveStore(store);
  return entry;
}

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  const store = loadStore();
  return store.auditLogs.slice(0, limit);
}

// ==========================================
// STATISTIKA OUTREACH-A (OUTREACH TODAY)
// ==========================================

export function getOutreachStats(): OutreachStats {
  const store = loadStore();
  const leads = Object.values(store.leads);

  const todayStr = new Date().toISOString().slice(0, 10);

  let messagesSent = 0;
  let messagesDelivered = 0;
  let replies = 0;
  let interested = 0;
  let notInterested = 0;
  let followups = 0;
  let errors = 0;
  let potentialDeals = 0;
  let won = 0;

  for (const lead of leads) {
    if (lead.status === "SENT") messagesSent++;
    if (lead.status === "REPLIED") replies++;
    if (lead.status === "INTERESTED") {
      interested++;
      potentialDeals++;
    }
    if (lead.status === "NOT_INTERESTED") notInterested++;
    if (lead.status === "FOLLOW_UP") followups++;
    if (lead.status === "ERROR") errors++;

    // Broji konverzacije
    if (lead.conversation && lead.conversation.length > 0) {
      for (const msg of lead.conversation) {
        if (msg.timestamp.startsWith(todayStr)) {
          if (msg.direction === "outgoing") {
            if (msg.status === "sent") messagesSent++;
            if (msg.status === "delivered" || msg.status === "read")
              messagesDelivered++;
            if (msg.status === "failed") errors++;
          } else if (msg.direction === "incoming") {
            replies++;
            if (msg.aiClassification === "INTERESTED") interested++;
            if (msg.aiClassification === "NOT_INTERESTED") notInterested++;
          }
        }
      }
    }
  }

  return {
    messagesSent,
    messagesDelivered,
    replies,
    interested,
    notInterested,
    followups,
    errors,
    potentialDeals,
    won,
  };
}
