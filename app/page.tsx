"use client";

import { useEffect, useState } from "react";
import FilterForm from "@/components/FilterForm";
import ResultsList from "@/components/ResultsList";
import OutreachMetrics from "@/components/OutreachMetrics";
import AutoOutreachBanner from "@/components/AutoOutreachBanner";
import OutreachTable from "@/components/OutreachTable";
import SettingsView from "@/components/SettingsView";
import AuditLogView from "@/components/AuditLogView";
import AnalysisModal from "@/components/AnalysisModal";
import ConversationModal from "@/components/ConversationModal";
import { normalizePhoneNumber } from "@/lib/whatsapp/phoneUtils";
import type {
  AppSettings,
  AuditLogEntry,
  Lead,
  OutreachStats,
  SearchParamsInput,
  WhatsAppTemplate,
} from "@/lib/types";

const DEFAULT_PARAMS: SearchParamsInput = {
  city: "Visoko",
  category: "Restaurants",
  minRating: 0,
  minReviews: 0,
  websiteFilter: "any",
};

const DEFAULT_STATS: OutreachStats = {
  messagesSent: 0,
  messagesDelivered: 0,
  replies: 0,
  interested: 0,
  notInterested: 0,
  followups: 0,
  errors: 0,
  potentialDeals: 0,
  won: 0,
};

type ActiveTab = "finder" | "outreach" | "settings" | "audit";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("finder");

  // Lead Finder State
  const [params, setParams] = useState<SearchParamsInput>(DEFAULT_PARAMS);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [resolvedCity, setResolvedCity] = useState<{
    name: string;
    radiusKm: number;
  } | null>(null);
  const [totalBeforeFilter, setTotalBeforeFilter] = useState<number | undefined>(undefined);
  const [totalAfterGeoFilter, setTotalAfterGeoFilter] = useState<number | undefined>(undefined);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState<boolean | null>(null);

  // Outreach & CRM State
  const [outreachLeads, setOutreachLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<OutreachStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isRunningQueue, setIsRunningQueue] = useState(false);

  // Modals
  const [analysisModalLead, setAnalysisModalLead] = useState<Lead | null>(null);
  const [conversationModalLead, setConversationModalLead] = useState<Lead | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  function showNotification(type: "success" | "error" | "info", text: string) {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  }

  // Učitaj outreach podatke iz API-ja
  async function loadOutreachData() {
    try {
      const res = await fetch("/api/outreach");
      if (res.ok) {
        const data = await res.json();
        setOutreachLeads(data.leads || []);
        setStats(data.stats || DEFAULT_STATS);
        if (data.settings) setSettings(data.settings);
        if (data.templates) setTemplates(data.templates);
      }
    } catch (err) {
      console.warn("Ne mogu dohvatiti outreach podatke:", err);
    }
  }

  // Učitaj audit logove
  async function loadAuditLogs() {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Ne mogu dohvatiti audit logove:", err);
    }
  }

  useEffect(() => {
    loadOutreachData();
    loadAuditLogs();
  }, []);

  // Postojeća Lead Finder pretraga
  async function runSearch(pageToken?: string) {
    const qs = new URLSearchParams({
      city: params.city,
      category: params.category,
      minRating: String(params.minRating),
      minReviews: String(params.minReviews),
      websiteFilter: params.websiteFilter,
    });
    if (pageToken) qs.set("pageToken", pageToken);

    const res = await fetch(`/api/leads?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Došlo je do greške prilikom pretrage.");
    }
    return data as {
      leads: Lead[];
      mockMode: boolean;
      nextPageToken: string | null;
      resolvedCity?: { name: string; radiusKm: number };
      totalBeforeFilter?: number;
      totalAfterGeoFilter?: number;
    };
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setLeads(null);
    setResolvedCity(null);
    setTotalBeforeFilter(undefined);
    setTotalAfterGeoFilter(undefined);
    setNextPageToken(null);
    try {
      const data = await runSearch();
      setLeads(data.leads);
      setMockMode(data.mockMode);
      setNextPageToken(data.nextPageToken);
      setResolvedCity(data.resolvedCity ?? null);
      setTotalBeforeFilter(data.totalBeforeFilter);
      setTotalAfterGeoFilter(data.totalAfterGeoFilter);
      loadOutreachData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepoznata greška.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleSearch();
  }, []);

  async function handleLoadMore() {
    if (!nextPageToken) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await runSearch(nextPageToken);
      setLeads((prev) => [...(prev ?? []), ...data.leads]);
      setNextPageToken(data.nextPageToken);
      loadOutreachData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepoznata greška.");
    } finally {
      setLoadingMore(false);
    }
  }

  // Ažuriraj lead u lokalnom stanju (i u leads listi i u outreach listi)
  function updateLeadInState(updated: Lead) {
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)) : prev
    );
    setOutreachLeads((prev) => {
      const idx = prev.findIndex((l) => l.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      }
      return [updated, ...prev];
    });

    if (analysisModalLead && analysisModalLead.id === updated.id) {
      setAnalysisModalLead(updated);
    }
    if (conversationModalLead && conversationModalLead.id === updated.id) {
      setConversationModalLead(updated);
    }
  }

  // Akcija: AI Analiza
  async function handleAnalyze(lead: Lead) {
    try {
      showNotification("info", `Pokrećem AI analizu za "${lead.name}"...`);
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", leadData: lead }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Greška pri AI analizi.");
      }
      updateLeadInState(data.lead);
      setAnalysisModalLead(data.lead);
      showNotification("success", `AI analiza završena za "${lead.name}".`);
      loadOutreachData();
      loadAuditLogs();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Greška pri analizi.");
    }
  }

  // Akcija: Generiši poruku
  async function handleGenerateMessage(lead: Lead) {
    try {
      showNotification("info", `Generišem personalizovanu poruku za "${lead.name}"...`);
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-message", leadData: lead }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Greška pri generisanju poruke.");
      }
      updateLeadInState(data.lead);
      setAnalysisModalLead(data.lead);
      showNotification("success", `Poruka uspješno pripremljena za "${lead.name}".`);
      loadOutreachData();
      loadAuditLogs();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Greška pri pripremi poruke.");
    }
  }

  // Akcija: Pošalji WhatsApp (Povezano direktno sa vašim WhatsAppom)
  async function handleSendWhatsApp(lead: Lead) {
    try {
      // 1. Ako nema generisanu poruku, generiši je
      let msg = lead.generatedMessage;
      let currentLead = lead;

      if (!msg) {
        showNotification("info", `Pripremam poruku za "${lead.name}"...`);
        const genRes = await fetch("/api/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate-message", leadData: lead }),
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          msg = genData.message;
          if (genData.lead) {
            currentLead = genData.lead;
            updateLeadInState(genData.lead);
          }
        }
      }

      // 2. Provjeri broj telefona
      const phoneNorm = currentLead.phone ? normalizePhoneNumber(currentLead.phone) : null;
      if (!phoneNorm || !phoneNorm.isValid || phoneNorm.type !== "mobile") {
        showNotification(
          "error",
          `Broj telefona (${currentLead.phone || "nema"}) nije mobilni ili nema validan format za WhatsApp.`
        );
        return;
      }

      // 3. Ako ima podešen Meta Cloud API token, pošalji preko API-ja
      const hasMetaApi = !!(settings?.whatsappAccessToken && settings?.whatsappPhoneNumberId);
      if (hasMetaApi) {
        showNotification("info", `Šaljem preko WhatsApp Business API-ja za "${currentLead.name}"...`);
        const res = await fetch("/api/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send", leadData: currentLead }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateLeadInState(data.lead);
          showNotification("success", `✅ WhatsApp poruka uspješno poslana za "${currentLead.name}"!`);
          loadOutreachData();
          return;
        }
      }

      // 4. DIREKTNO OTVARANJE U VAŠEM WHATSAPP-U (wa.me)
      const finalMsg =
        msg ||
        `Pozdrav, javljam se u vezi ${currentLead.name}. Vidio sam vaš profil na Google mapi, pa vam šaljem kratak prijedlog za modernu web stranicu.`;
      const waUrl = `https://wa.me/${phoneNorm.e164}?text=${encodeURIComponent(finalMsg)}`;

      window.open(waUrl, "_blank");

      // Zabilježi u bazi kao poslano
      const markRes = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-sent",
          leadData: currentLead,
          customText: finalMsg,
        }),
      });
      if (markRes.ok) {
        const markData = await markRes.json();
        if (markData.lead) updateLeadInState(markData.lead);
      }

      showNotification("success", `🚀 Otvoren vaš WhatsApp sa pripremljenom porukom za "${currentLead.name}"!`);
      loadOutreachData();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Greška pri slanju.");
    }
  }

  // Akcija: Zakaži Follow-up
  async function handleScheduleFollowup(lead: Lead) {
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule-followup", leadId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Greška pri zakazivanju.");
      }
      updateLeadInState(data.lead);
      showNotification("success", `Follow-up zakazan za "${lead.name}".`);
      loadOutreachData();
      loadAuditLogs();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Greška pri zakazivanju.");
    }
  }

  // Akcija: Do Not Contact
  async function handleDoNotContact(lead: Lead) {
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dnc",
          leadData: lead,
          reason: "Korisnik je postavio DO NOT CONTACT",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Greška pri postavljanju DNC.");
      }
      updateLeadInState(data.lead);
      showNotification("info", `🚫 "${lead.name}" je označen kao DO NOT CONTACT.`);
      loadOutreachData();
      loadAuditLogs();
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Greška pri postavljanju DNC.");
    }
  }

  // Akcija: Slanje odgovora u modalu konverzacije
  async function handleSendReply(leadId: string, text: string) {
    const res = await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-reply", leadId, customText: text }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Greška pri slanju odgovora.");
    }
    updateLeadInState(data.lead);
    showNotification("success", "Odgovor uspješno poslan preko WhatsApp-a!");
    loadOutreachData();
    loadAuditLogs();
  }

  // Akcija: Auto Outreach Toggle
  async function handleToggleAuto(enabled: boolean) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoOutreachEnabled: enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      showNotification(
        "info",
        enabled ? "🟢 AUTO OUTREACH je UKLJUČEN." : "⏸️ AUTO OUTREACH je PAUZIRAN."
      );
      loadAuditLogs();
    }
  }

  // Akcija: Pokreni Queue Odmah
  async function handleRunQueue() {
    setIsRunningQueue(true);
    try {
      const res = await fetch("/api/outreach/auto", { method: "POST" });
      const data = await res.json();
      showNotification(
        "success",
        `Queue obrađen: ${data.sent} poslano, ${data.skipped} preskočeno, ${data.errors} grešaka.`
      );
      loadOutreachData();
      loadAuditLogs();
    } catch (err) {
      showNotification("error", "Greška pri pokretanju queue-a.");
    } finally {
      setIsRunningQueue(false);
    }
  }

  // Akcija: Sačuvaj postavke
  async function handleSaveSettings(updated: Partial<AppSettings>) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      showNotification("success", "Postavke uspješno ažurirane!");
      loadAuditLogs();
    }
  }

  // Akcija: Sačuvaj template
  async function handleSaveTemplate(tpl: WhatsAppTemplate) {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tpl),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.name === tpl.name);
        if (idx >= 0) {
          const c = [...prev];
          c[idx] = data.template;
          return c;
        }
        return [...prev, data.template];
      });
      showNotification("success", `Template "${tpl.name}" sačuvan!`);
      loadAuditLogs();
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Obavještenje / Toast */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 ${
            notification.type === "success"
              ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
              : notification.type === "error"
              ? "bg-red-950 border-red-500/50 text-red-200"
              : "bg-surface border-border text-white"
          }`}
        >
          <span>
            {notification.type === "success"
              ? "✅"
              : notification.type === "error"
              ? "❌"
              : "ℹ️"}
          </span>
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-muted hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zaglavlje aplikacije */}
      <header className="flex flex-col gap-2.5 border-b border-border/40 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>⚡</span> LocalLead · AI Lead Finder & WhatsApp
            </h1>
            <p className="text-muted text-xs mt-0.5">
              Pronađite stvarne lokalne firme sa Google-a i pošaljite im gotovu ponudu direktno na WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Places API: Povezan
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              WhatsApp: Povezan (Tvoj WhatsApp)
            </span>
          </div>
        </div>

        {/* Tab navigacija */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <button
            onClick={() => setActiveTab("finder")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "finder"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "bg-surface hover:bg-surfaceHover text-muted hover:text-white border border-border"
            }`}
          >
            <span>🔍</span> 1. Pronađi firme
          </button>

          <button
            onClick={() => {
              setActiveTab("outreach");
              loadOutreachData();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "outreach"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "bg-surface hover:bg-surfaceHover text-muted hover:text-white border border-border"
            }`}
          >
            <span>💬</span> 2. Poslane poruke & Klijenti
            {outreachLeads.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "outreach"
                    ? "bg-bg text-accent font-bold"
                    : "bg-border text-muted"
                }`}
              >
                {outreachLeads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-accent text-bg shadow-md shadow-accent/20"
                : "bg-surface hover:bg-surfaceHover text-muted hover:text-white border border-border"
            }`}
          >
            <span>⚙️</span> 3. Moje postavke (Ime, cijene, poruka)
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              loadAuditLogs();
            }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ml-auto ${
              activeTab === "audit"
                ? "bg-surface border border-accent text-accent"
                : "text-muted/60 hover:text-muted"
            }`}
          >
            <span>📜</span> Historija
          </button>
        </div>
      </header>

      {/* TAB 1: PRONAĐI FIRME (LEAD FINDER) */}
      {activeTab === "finder" && (
        <div className="flex flex-col gap-5">
          {/* Jednostavan vodič u 3 koraka */}
          <div className="bg-surface/80 border border-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white bg-accent/20 text-accent px-2 py-0.5 rounded">1</span>
              <span>Upiši grad i kategoriju</span>
            </div>
            <span className="text-muted/40 hidden sm:inline">➔</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white bg-accent/20 text-accent px-2 py-0.5 rounded">2</span>
              <span>Klikni "Pronađi firme"</span>
            </div>
            <span className="text-muted/40 hidden sm:inline">➔</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">3</span>
              <span>Klikni <strong>"💬 WhatsApp"</strong> i poruka se odmah otvara u WhatsAppu!</span>
            </div>
          </div>
          <FilterForm
            value={params}
            onChange={setParams}
            onSubmit={handleSearch}
            loading={loading}
          />

          {loading && (
            <div className="text-center text-muted py-12 text-sm flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Pretražujem Google Places API za grad {params.city}...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {leads !== null && !loading && !error && (
            <ResultsList
              leads={leads}
              hasMore={!!nextPageToken}
              loadingMore={loadingMore}
              onLoadMore={handleLoadMore}
              resolvedCity={resolvedCity}
              totalBeforeFilter={totalBeforeFilter}
              totalAfterGeoFilter={totalAfterGeoFilter}
              onAnalyze={handleAnalyze}
              onGenerateMessage={handleGenerateMessage}
              onSendWhatsApp={handleSendWhatsApp}
              onViewConversation={(lead) => setConversationModalLead(lead)}
              onScheduleFollowup={handleScheduleFollowup}
              onDoNotContact={handleDoNotContact}
            />
          )}
        </div>
      )}

      {/* TAB 2: WHATSAPP OUTREACH TAB */}
      {activeTab === "outreach" && (
        <div className="flex flex-col gap-6">
          {settings && (
            <AutoOutreachBanner
              settings={settings}
              onToggleAuto={handleToggleAuto}
              onRunQueue={handleRunQueue}
              isRunningQueue={isRunningQueue}
            />
          )}

          <OutreachMetrics stats={stats} />

          <OutreachTable
            leads={outreachLeads}
            onAnalyze={handleAnalyze}
            onGenerateMessage={handleGenerateMessage}
            onSendWhatsApp={handleSendWhatsApp}
            onViewConversation={(lead) => setConversationModalLead(lead)}
            onScheduleFollowup={handleScheduleFollowup}
            onDoNotContact={handleDoNotContact}
          />
        </div>
      )}

      {/* TAB 3: POSTAVKE & AI */}
      {activeTab === "settings" && settings && (
        <SettingsView
          settings={settings}
          templates={templates}
          onSaveSettings={handleSaveSettings}
          onSaveTemplate={handleSaveTemplate}
        />
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <AuditLogView logs={auditLogs} onRefresh={loadAuditLogs} />
      )}

      {/* MODALI */}
      {analysisModalLead && (
        <AnalysisModal
          lead={analysisModalLead}
          onClose={() => setAnalysisModalLead(null)}
          onGenerateMessage={handleGenerateMessage}
          onSendWhatsApp={handleSendWhatsApp}
          onDoNotContact={handleDoNotContact}
        />
      )}

      {conversationModalLead && (
        <ConversationModal
          lead={conversationModalLead}
          onClose={() => setConversationModalLead(null)}
          onSendReply={handleSendReply}
        />
      )}
    </main>
  );
}
