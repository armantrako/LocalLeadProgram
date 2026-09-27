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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await onSaveSettings(form);
      setSuccessMsg("Postavke su uspješno sačuvane!");
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

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* 1. AI PRODAJNI KONTEKST I PONUDA */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>🎯</span> AI Prodajni Kontekst & Agencija
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Ove informacije AI koristi za automatsku personalizaciju ponude, cijena i odgovora klijentima.
            </p>
          </div>
          {successMsg && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded">
              {successMsg}
            </span>
          )}
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

        {/* 2. AUTOMATION & RATE LIMITS */}
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
              <span className="text-[10px] text-muted/70">Zadano: 2 (Preporučeno za etički outreach)</span>
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
            className="bg-accent hover:bg-accentSoft text-bg font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Snimam..." : "💾 Sačuvaj postavke"}
          </button>
        </div>
      </form>

      {/* 3. TEMPLATE MANAGER */}
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

      {/* 4. META WHATSAPP CREDENTIALS STATUS & UPUTSTVO */}
      <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-3 shadow-sm">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>🔒</span> Meta WhatsApp Business Cloud API Postavke
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Iz bezbjednosnih razloga, API ključevi i tokeni se <strong>nikada ne unose kroz browser</strong>, već se postavljaju isključivo kao tajne environment variables na serveru:
        </p>

        <div className="bg-bg border border-border rounded-lg p-4 text-xs font-mono text-muted space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">WHATSAPP_ACCESS_TOKEN</span>
            <span className="text-[11px] text-accent">Server-side tajna</span>
          </div>
          <p className="text-[11px] text-muted/70 font-sans">
            Stalni (System User) token sa dozvolama <code>whatsapp_business_messaging</code> i <code>whatsapp_business_management</code>.
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-white font-semibold">WHATSAPP_PHONE_NUMBER_ID</span>
            <span className="text-[11px] text-accent">ID testnog ili produkcijskog broja</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-white font-semibold">WHATSAPP_BUSINESS_ACCOUNT_ID (WABA ID)</span>
            <span className="text-[11px] text-accent">ID vašeg WhatsApp Business naloga</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-white font-semibold">WHATSAPP_VERIFY_TOKEN</span>
            <span className="text-[11px] text-accent">Tajni string za Webhook verifikaciju</span>
          </div>
        </div>

        <div className="text-xs text-muted/80 bg-accent/5 border border-accent/20 rounded-lg p-3">
          💡 <strong>Webhook URL za Meta Dashboard:</strong> <br />
          <code className="text-accent font-mono text-[11px] mt-1 inline-block">
            https://lead-finder-two-alpha.vercel.app/api/whatsapp/webhook
          </code>
        </div>
      </div>
    </div>
  );
}
