"use client";

import { useState } from "react";
import type { AppSettings, WhatsAppTemplate } from "@/lib/types";

interface Props {
  settings: AppSettings;
  templates: WhatsAppTemplate[];
  onSaveSettings: (updated: Partial<AppSettings>) => Promise<void>;
  onSaveTemplate: (template: WhatsAppTemplate) => Promise<void>;
}

export default function SettingsView({
  settings,
  templates,
  onSaveSettings,
  onSaveTemplate,
}: Props) {
  const [form, setForm] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Template edit state
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(
    templates.find((t) => t.name === form.activeTemplate) || templates[0]
  );
  const [templateBody, setTemplateBody] = useState(selectedTemplate?.body || "");
  const [savingTpl, setSavingTpl] = useState(false);
  const [tplSuccessMsg, setTplSuccessMsg] = useState<string | null>(null);

  // API Connection test states
  const [showTokens, setShowTokens] = useState(false);
  const [testingGoogle, setTestingGoogle] = useState(false);
  const [googleResult, setGoogleResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testingWa, setTestingWa] = useState(false);
  const [waResult, setWaResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testingAi, setTestingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [copiedWebhook, setCopiedWebhook] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await onSaveSettings(form);
      setSuccessMsg("Postavke i API konfiguracija su uspješno sačuvani!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleTemplateSave() {
    setSavingTpl(true);
    setTplSuccessMsg(null);
    try {
      await onSaveTemplate({
        ...selectedTemplate,
        body: templateBody,
      });
      setTplSuccessMsg("Template uspješno ažuriran!");
      setTimeout(() => setTplSuccessMsg(null), 3000);
    } finally {
      setSavingTpl(false);
    }
  }

  async function testGoogleConnection() {
    setTestingGoogle(true);
    setGoogleResult(null);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "google",
          apiKey: form.googleMapsApiKey,
        }),
      });
      const data = await res.json();
      setGoogleResult({
        ok: data.success,
        msg: data.success ? data.message : data.error,
      });
    } catch (err) {
      setGoogleResult({ ok: false, msg: "Neuspješno slanje zahtjeva za test." });
    } finally {
      setTestingGoogle(false);
    }
  }

  async function testWhatsAppConnection() {
    setTestingWa(true);
    setWaResult(null);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "whatsapp",
          accessToken: form.whatsappAccessToken,
          phoneNumberId: form.whatsappPhoneNumberId,
        }),
      });
      const data = await res.json();
      setWaResult({
        ok: data.success,
        msg: data.success ? data.message : data.error,
      });
    } catch (err) {
      setWaResult({ ok: false, msg: "Neuspješno slanje zahtjeva za test." });
    } finally {
      setTestingWa(false);
    }
  }

  async function testOpenAIConnection() {
    setTestingAi(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "openai",
          apiKey: form.openaiApiKey,
        }),
      });
      const data = await res.json();
      setAiResult({
        ok: data.success,
        msg: data.success ? data.message : data.error,
      });
    } catch (err) {
      setAiResult({ ok: false, msg: "Neuspješno slanje zahtjeva za test." });
    } finally {
      setTestingAi(false);
    }
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/whatsapp/webhook`
      : "https://lead-finder-two-alpha.vercel.app/api/whatsapp/webhook";

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 1. API INTEGRACIJE & POVEZIVANJE */}
        <div className="bg-surface border border-accent/30 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>🔑</span> API Konfiguracija & Integracije
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Povežite Google Places API, Meta WhatsApp Cloud API i OpenAI za potpunu automatizaciju.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTokens(!showTokens)}
                className="text-xs text-muted hover:text-white bg-bg border border-border px-2.5 py-1 rounded-lg transition-colors"
              >
                {showTokens ? "🔒 Sakrij tokene" : "👁️ Prikaži tokene"}
              </button>
              {successMsg && (
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded">
                  {successMsg}
                </span>
              )}
            </div>
          </div>

          {/* GOOGLE PLACES API */}
          <div className="bg-bg/50 border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">📍 Google Places API (New)</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Aktivno
                </span>
              </div>
              <button
                type="button"
                onClick={testGoogleConnection}
                disabled={testingGoogle}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border text-white px-3 py-1 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {testingGoogle ? "Testiram..." : "🧪 Testiraj konekciju"}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">
                Google Maps / Places API Key (Opcionalno ako je već u .env.local):
              </label>
              <input
                type={showTokens ? "text" : "password"}
                value={form.googleMapsApiKey || ""}
                onChange={(e) => setForm({ ...form, googleMapsApiKey: e.target.value })}
                placeholder="AIzaSy... (Preuzima se automatski iz serverskog okruženja)"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {googleResult && (
              <div
                className={`text-xs p-2.5 rounded-lg border ${
                  googleResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {googleResult.ok ? "✓ " : "✕ "}
                {googleResult.msg}
              </div>
            )}
          </div>

          {/* META WHATSAPP CLOUD API */}
          <div className="bg-bg/50 border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">💬 Meta WhatsApp Business Cloud API</span>
                <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                  Meta Graph API v20.0
                </span>
              </div>
              <button
                type="button"
                onClick={testWhatsAppConnection}
                disabled={testingWa}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border text-white px-3 py-1 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {testingWa ? "Provjeravam..." : "🧪 Testiraj WhatsApp API"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted">
                  WhatsApp Access Token (System User Permanent Token sa whatsapp_business_messaging dozvolom):
                </label>
                <input
                  type={showTokens ? "text" : "password"}
                  value={form.whatsappAccessToken || ""}
                  onChange={(e) => setForm({ ...form, whatsappAccessToken: e.target.value })}
                  placeholder="EAAG..."
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">WhatsApp Phone Number ID:</label>
                <input
                  type="text"
                  value={form.whatsappPhoneNumberId || ""}
                  onChange={(e) => setForm({ ...form, whatsappPhoneNumberId: e.target.value })}
                  placeholder="npr. 109283746501928"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">WhatsApp Business Account ID (WABA ID):</label>
                <input
                  type="text"
                  value={form.whatsappBusinessAccountId || ""}
                  onChange={(e) => setForm({ ...form, whatsappBusinessAccountId: e.target.value })}
                  placeholder="npr. 982736450192837"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted">Webhook Verify Token (Za primanje poruka):</label>
                <input
                  type="text"
                  value={form.whatsappVerifyToken || ""}
                  onChange={(e) => setForm({ ...form, whatsappVerifyToken: e.target.value })}
                  placeholder="proizvoljan_sigurni_token_za_meta_dashboard"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {waResult && (
              <div
                className={`text-xs p-2.5 rounded-lg border ${
                  waResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {waResult.ok ? "✓ " : "✕ "}
                {waResult.msg}
              </div>
            )}

            <div className="flex items-center justify-between text-xs bg-bg border border-border/80 rounded-lg p-3 mt-1">
              <div>
                <span className="text-muted">Meta Webhook Callback URL:</span>
                <span className="block font-mono text-accent text-[11px] mt-0.5">{webhookUrl}</span>
              </div>
              <button
                type="button"
                onClick={copyWebhook}
                className="bg-surface hover:bg-surfaceHover border border-border text-white px-2.5 py-1 rounded text-xs transition-colors"
              >
                {copiedWebhook ? "Kopirano ✓" : "Kopiraj URL"}
              </button>
            </div>
          </div>

          {/* OPENAI / AI PROVIDER */}
          <div className="bg-bg/50 border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">🤖 OpenAI / LLM Model</span>
                <span className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                  {form.aiProvider === "builtin" ? "Ugrađeni AI mehanizam" : "OpenAI API"}
                </span>
              </div>
              <button
                type="button"
                onClick={testOpenAIConnection}
                disabled={testingAi}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border text-white px-3 py-1 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {testingAi ? "Provjeravam..." : "🧪 Testiraj OpenAI"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-muted">OpenAI API Key (sk-...):</label>
                <input
                  type={showTokens ? "text" : "password"}
                  value={form.openaiApiKey || ""}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  placeholder="sk-proj-... (Opcionalno - ako nije unesen, koristi se ugrađeni AI algoritam)"
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {aiResult && (
              <div
                className={`text-xs p-2.5 rounded-lg border ${
                  aiResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-300"
                }`}
              >
                {aiResult.ok ? "✓ " : "✕ "}
                {aiResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* 2. AI PRODAJNI KONTEKST I PONUDA */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>🎯</span> AI Prodajni Kontekst & Agencija
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Ove informacije AI koristi za automatsku personalizaciju ponude, cijena i odgovora klijentima.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Vaše ime i prezime</label>
              <input
                type="text"
                required
                value={form.myName}
                onChange={(e) => setForm({ ...form, myName: e.target.value })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Naziv agencije / servisa</label>
              <input
                type="text"
                required
                value={form.agencyName}
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-muted">Kratak opis usluga web stranica</label>
              <textarea
                rows={2}
                required
                value={form.serviceDescription}
                onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Osnovna cijena izrade (Base price)</label>
              <input
                type="text"
                required
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                placeholder="450 KM"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Mjesečno održavanje i hosting</label>
              <input
                type="text"
                required
                value={form.maintenancePrice}
                onChange={(e) => setForm({ ...form, maintenancePrice: e.target.value })}
                placeholder="50 KM/mjesečno"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Demo URL primjera stranice</label>
              <input
                type="text"
                required
                value={form.demoUrl}
                onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                placeholder="https://restoran-demo.ba"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Ton poruke (Message tone)</label>
              <select
                value={form.messageTone}
                onChange={(e) => setForm({ ...form, messageTone: e.target.value as any })}
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="friendly">Prijateljski i profesionalan (Preporučeno)</option>
                <option value="professional">Strogo poslovan i formalan</option>
                <option value="direct">Kratak i direktan</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Kontakt telefon za WhatsApp</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+387 61 000 000"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Kontakt email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="kontakt@agencija.ba"
                className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* 3. AUTOMATION & RATE LIMITS */}
          <div className="border-t border-border/60 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
              <span>⏱️</span> Limiteri Slanja i WhatsApp Pravila (Anti-Spam)
            </h3>
            <p className="text-xs text-muted mb-4">
              Konzervativni limiti osiguravaju visoku reputaciju vašeg WhatsApp broja i sprječavaju blokade.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Maksimalno poruka dnevno</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.maxDailyOutreach}
                  onChange={(e) => setForm({ ...form, maxDailyOutreach: Number(e.target.value) })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Maksimalno poruka po satu</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.maxHourlyOutreach}
                  onChange={(e) => setForm({ ...form, maxHourlyOutreach: Number(e.target.value) })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Razmak između poruka (sekunde)</label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={form.minDelaySeconds}
                  onChange={(e) => setForm({ ...form, minDelaySeconds: Number(e.target.value) })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Maksimalan broj follow-upova</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={form.maxFollowups}
                  onChange={(e) => setForm({ ...form, maxFollowups: Number(e.target.value) })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Dani do prvog follow-up podsjetnika</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={form.followupDelayDays}
                  onChange={(e) => setForm({ ...form, followupDelayDays: Number(e.target.value) })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Način slanja (Message Type)</label>
                <select
                  value={form.whatsappMessageType}
                  onChange={(e) => setForm({ ...form, whatsappMessageType: e.target.value as any })}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="template">Approved Template (Obavezno za novi kontakt)</option>
                  <option value="freeform">Free-form reply (Samo unutar 24h prozora)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent hover:bg-accentSoft text-bg font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shadow-md"
            >
              {saving ? "Snimam..." : "💾 Sačuvaj sve postavke i API ključeve"}
            </button>
          </div>
        </div>
      </form>

      {/* 4. TEMPLATE MANAGER */}
      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>📑</span> WhatsApp Template Manager
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Meta WhatsApp Business Platform zahtijeva odobrene template za iniciranje razgovora.
            </p>
          </div>
          {tplSuccessMsg && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded">
              {tplSuccessMsg}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted font-medium">Odaberite template:</label>
            <select
              value={selectedTemplate?.name}
              onChange={(e) => {
                const tpl = templates.find((t) => t.name === e.target.value);
                if (tpl) {
                  setSelectedTemplate(tpl);
                  setTemplateBody(tpl.body);
                }
              }}
              className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>

            <span className="text-[11px] bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded font-mono">
              Status: {selectedTemplate?.status}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Tekst poruke sa varijablama:</label>
            <textarea
              rows={4}
              value={templateBody}
              onChange={(e) => setTemplateBody(e.target.value)}
              className="bg-bg border border-border rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Podržane varijable:</span>
            <code className="bg-bg px-2 py-0.5 rounded text-accent">&#123;&#123;business_name&#125;&#125;</code>
            <code className="bg-bg px-2 py-0.5 rounded text-accent">&#123;&#123;city&#125;&#125;</code>
            <code className="bg-bg px-2 py-0.5 rounded text-accent">&#123;&#123;category&#125;&#125;</code>
            <code className="bg-bg px-2 py-0.5 rounded text-accent">&#123;&#123;demo_url&#125;&#125;</code>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleTemplateSave}
              disabled={savingTpl}
              className="bg-bg hover:bg-surfaceHover border border-border hover:border-accent text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {savingTpl ? "Snimam..." : "💾 Snimi izmjene template-a"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
