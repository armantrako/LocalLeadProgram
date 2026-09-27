"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";

interface Props {
  lead: Lead;
  onClose: () => void;
  onGenerateMessage: (lead: Lead) => Promise<void>;
  onSendWhatsApp: (lead: Lead) => Promise<void>;
  onDoNotContact: (lead: Lead) => Promise<void>;
}

export default function AnalysisModal({
  lead,
  onClose,
  onGenerateMessage,
  onSendWhatsApp,
  onDoNotContact,
}: Props) {
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [dncLoading, setDncLoading] = useState(false);

  const analysis = lead.analysis;

  async function handleGenMessage() {
    setLoadingMsg(true);
    try {
      await onGenerateMessage(lead);
    } finally {
      setLoadingMsg(false);
    }
  }

  async function handleSend() {
    setSending(true);
    try {
      await onSendWhatsApp(lead);
    } finally {
      setSending(false);
    }
  }

  async function handleDnc() {
    if (confirm(`Označiti biznis "${lead.name}" kao DO NOT CONTACT? Taj broj se više nikada neće kontaktirati.`)) {
      setDncLoading(true);
      try {
        await onDoNotContact(lead);
      } finally {
        setDncLoading(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Zaglavlje */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">
                🤖 AI Analiza: {lead.name}
              </span>
              <span className="text-xs bg-bg border border-border px-2 py-0.5 rounded text-accent font-medium">
                {lead.status || "NEW"}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              📍 {lead.city || lead.address || "BiH"} · ⭐ {lead.rating?.toFixed(1) || "N/A"} ({lead.reviewCount || 0} recenzija)
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-lg p-1.5 rounded-lg hover:bg-border/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tijelo */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-sm">
          {analysis ? (
            <div className="flex flex-col gap-3.5">
              {/* Zašto je potencijalni klijent */}
              <div className="bg-bg/60 border border-border/70 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>🎯</span> Zašto je idealan klijent
                </div>
                <p className="text-muted text-xs leading-relaxed">{analysis.whyIdealClient}</p>
              </div>

              {/* Status web stranice i online prisustvo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-bg/60 border border-border/70 rounded-xl p-3">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    🌐 Status web stranice
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    {analysis.hasWebsite ? (
                      <span className="text-emerald-400">Prijavljen website</span>
                    ) : (
                      <span className="text-amber-400 font-medium">NEMA web stranicu (Najveći prioritet)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted/80 mt-1">{analysis.websiteAnalysis}</p>
                </div>

                <div className="bg-bg/60 border border-border/70 rounded-xl p-3">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    📈 Kvalitet online prisustva
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                        analysis.onlinePresenceQuality === "excellent"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : analysis.onlinePresenceQuality === "good"
                          ? "bg-accent/20 text-accent"
                          : "bg-muted/20 text-muted"
                      }`}
                    >
                      {analysis.onlinePresenceQuality}
                    </span>
                    <span className="text-[11px] text-muted">
                      ({lead.reviewCount || 0} recenzija, ocjena {lead.rating || "N/A"})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted/80 mt-2">{analysis.websitePotential}</p>
                </div>
              </div>

              {/* Najbolji prodajni ugao */}
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-3.5">
                <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>💡</span> Najbolji prodajni ugao (Sales Angle)
                </div>
                <p className="text-xs text-white leading-relaxed">{analysis.bestSalesAngle}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted text-xs">
              AI analiza još nije pokrenuta za ovaj lead.
            </div>
          )}

          {/* Generisana poruka */}
          <div className="bg-bg/80 border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span>💬</span> WhatsApp poruka za slanje
              </span>
              {lead.selectedTemplate && (
                <span className="text-[10px] text-accent font-mono bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  Template: {lead.selectedTemplate}
                </span>
              )}
            </div>

            {lead.generatedMessage ? (
              <div className="bg-surface border border-border/60 rounded-lg p-3 text-xs text-white leading-relaxed whitespace-pre-wrap">
                {lead.generatedMessage}
              </div>
            ) : (
              <p className="text-xs text-muted/70 italic py-2">
                Poruka još nije generisana. Kliknite ispod da AI pripremi personalizovan tekst.
              </p>
            )}

            {lead.eligibility && !lead.eligibility.isEligible && (
              <div className="text-[11px] bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg mt-1">
                ⚠️ <strong>Nije podoban za automatsko slanje:</strong> {lead.eligibility.reason}
              </div>
            )}
          </div>
        </div>

        {/* Podnožje sa akcijama */}
        <div className="p-3 border-t border-border bg-bg/50 flex flex-wrap gap-2 items-center justify-between">
          <button
            onClick={handleDnc}
            disabled={dncLoading || lead.doNotContact}
            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {lead.doNotContact ? "🚫 NA DNC LISTI" : "🚫 Do Not Contact"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenMessage}
              disabled={loadingMsg}
              className="text-xs bg-bg border border-border hover:border-accent hover:text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loadingMsg ? "Generišem..." : "✍️ Regeneriši poruku"}
            </button>

            <button
              onClick={handleSend}
              disabled={sending || lead.doNotContact}
              className="text-xs bg-accent hover:bg-accentSoft text-bg font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Šaljem..." : "📤 Pošalji WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
