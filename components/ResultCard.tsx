"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import type { Lead } from "@/lib/types";
import { normalizePhoneNumber } from "@/lib/whatsapp/phoneUtils";

function scoreEmoji(score: number) {
  if (score >= 70) return "🔥";
  if (score >= 40) return "⚡";
  return "🔹";
}

interface Props {
  lead: Lead;
  onAnalyze?: (lead: Lead) => void;
  onGenerateMessage?: (lead: Lead) => void;
  onSendWhatsApp?: (lead: Lead) => void;
  onViewConversation?: (lead: Lead) => void;
  onScheduleFollowup?: (lead: Lead) => void;
  onDoNotContact?: (lead: Lead) => void;
}

export default function ResultCard({
  lead,
  onAnalyze,
  onGenerateMessage,
  onSendWhatsApp,
  onViewConversation,
  onScheduleFollowup,
  onDoNotContact,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Tihi fallback
    }
  }

  const conversationCount = lead.conversation?.length || 0;
  const phoneNorm = lead.phone ? normalizePhoneNumber(lead.phone) : null;
  const isMobile = phoneNorm?.isValid && phoneNorm.type === "mobile";
  const waDirectUrl = isMobile
    ? `https://wa.me/${phoneNorm.e164}?text=${encodeURIComponent(
        lead.generatedMessage ||
          `Pozdrav, javljam se u vezi ${lead.name}. Vidio sam vaš profil na Google mapi, pa bih vam poslao kratak primjer kako bi mogla izgledati moderna web prezentacija.`
      )}`
    : null;

  return (
    <div
      className={`bg-surface border rounded-xl p-5 flex flex-col justify-between gap-3.5 transition-all ${
        lead.doNotContact
          ? "border-red-500/40 bg-red-950/5 opacity-80"
          : lead.status === "INTERESTED"
          ? "border-accent/60 bg-accent/5 shadow-md shadow-accent/5"
          : "border-border hover:border-accent/40"
      }`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Zaglavlje kartice */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold leading-tight text-white">
                {lead.name}
              </span>
              <StatusBadge status={lead.status || "NEW"} />
            </div>

            <div className="text-sm text-muted mt-1">
              📍 {lead.address ?? "Adresa nije dostupna"}
            </div>

            {typeof lead.distanceKm === "number" && (
              <div className="text-xs text-accent/80 font-medium mt-0.5">
                📏 {lead.distanceKm.toFixed(1)} km od centra
              </div>
            )}
          </div>

          <div className="shrink-0 bg-bg border border-border rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap">
            {scoreEmoji(lead.leadScore)} {lead.leadScore}/100
          </div>
        </div>

        {/* Metrike i kontakt */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <span>⭐ {typeof lead.rating === "number" ? lead.rating.toFixed(1) : "Nije dostupno"}</span>
          <span>💬 {typeof lead.reviewCount === "number" ? `${lead.reviewCount} recenzija` : "Nema recenzija"}</span>
          <span className={lead.website ? "text-green-400 font-medium" : "text-amber-400 font-medium"}>
            {lead.website ? "🌐 Ima website" : "❌ No website"}
          </span>
          <span>📞 {lead.phone ?? "Telefon nije dostupan"}</span>
        </div>

        {/* Razlozi za Lead Score */}
        <div className="text-xs text-muted/80 bg-bg/50 border border-border/50 rounded-lg px-2.5 py-1.5">
          {lead.scoreReasons && lead.scoreReasons.length > 0
            ? lead.scoreReasons.join(" · ")
            : "Nema detalja"}
        </div>

        {/* Prikaz greške ako postoji */}
        {lead.lastError && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
            ⚠️ <strong>Greška ({lead.lastError.code}):</strong> {lead.lastError.message}
          </div>
        )}

        {/* AI & WhatsApp Outreach traka akcija */}
        <div className="bg-bg/40 border border-border/60 rounded-xl p-2.5 flex flex-wrap gap-1.5 items-center justify-between mt-1">
          <div className="flex flex-wrap gap-1.5">
            {onAnalyze && (
              <button
                type="button"
                onClick={() => onAnalyze(lead)}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border hover:border-accent/50 text-white px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                title="Pokreni AI analizu biznisa"
              >
                <span>🤖</span> AI Analiza
              </button>
            )}

            {onGenerateMessage && (
              <button
                type="button"
                onClick={() => onGenerateMessage(lead)}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border hover:border-accent/50 text-white px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                title="Generiši personalizovanu WhatsApp poruku"
              >
                <span>✍️</span> Poruka
              </button>
            )}

            {onSendWhatsApp && (
              <button
                type="button"
                onClick={() => onSendWhatsApp(lead)}
                disabled={lead.doNotContact}
                className="text-xs bg-accent/15 hover:bg-accent border border-accent/40 text-accent hover:text-bg font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Pošalji poruku preko službenog Meta WhatsApp API-ja"
              >
                <span>💬</span> WhatsApp API
              </button>
            )}

            {waDirectUrl && !lead.doNotContact && (
              <a
                href={waDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs bg-emerald-500/15 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-400 hover:text-bg font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                title="Otvori direktno u WhatsApp aplikaciji (1-klik slanje sa porukom)"
              >
                <span>📲</span> Direktni WA
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {onViewConversation && (
              <button
                type="button"
                onClick={() => onViewConversation(lead)}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border hover:border-accent/50 text-muted hover:text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                title="Pogledaj historiju razgovora"
              >
                <span>👁️</span> Razgovor
                {conversationCount > 0 && (
                  <span className="text-[10px] bg-accent/20 text-accent font-bold px-1.5 py-0.2 rounded-full">
                    {conversationCount}
                  </span>
                )}
              </button>
            )}

            {onScheduleFollowup && (
              <button
                type="button"
                onClick={() => onScheduleFollowup(lead)}
                className="text-xs bg-surface hover:bg-surfaceHover border border-border hover:border-accent/50 text-muted hover:text-white px-2 py-1.5 rounded-lg transition-colors"
                title="Zakaži follow-up podsjetnik"
              >
                📅 Follow-up
              </button>
            )}

            {onDoNotContact && (
              <button
                type="button"
                onClick={() => onDoNotContact(lead)}
                className={`text-xs px-2 py-1.5 rounded-lg transition-colors font-medium ${
                  lead.doNotContact
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "text-muted/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                }`}
                title="Označi kao DO NOT CONTACT"
              >
                {lead.doNotContact ? "🚫 DNC" : "🚫"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Donji linkovi */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40 mt-1 items-center">
        {lead.mapsUrl && (
          <a
            href={lead.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-bg border border-border rounded-lg px-3 py-1.5 hover:border-accent/50 hover:text-white transition-colors"
          >
            OPEN MAPS
          </a>
        )}
        {lead.phone ? (
          <button
            onClick={copyPhone}
            className="text-xs bg-bg border border-border rounded-lg px-3 py-1.5 hover:border-accent/50 hover:text-white transition-colors"
          >
            {copied ? "KOPIRANO ✓" : "COPY PHONE"}
          </button>
        ) : (
          <span className="text-xs text-muted/60 bg-bg/40 border border-border/40 rounded-lg px-2.5 py-1.5">
            Nema telefona
          </span>
        )}
        {lead.website ? (
          <a
            href={lead.website}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-accent/15 border border-accent/40 text-accent rounded-lg px-3 py-1.5 hover:bg-accent hover:text-bg font-medium transition-colors ml-auto"
          >
            OPEN WEBSITE
          </a>
        ) : (
          <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-3 py-1.5 font-medium ml-auto">
            NO WEBSITE
          </span>
        )}
      </div>
    </div>
  );
}
