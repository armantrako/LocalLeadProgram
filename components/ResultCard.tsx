"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";

function scoreEmoji(score: number) {
  if (score >= 70) return "🔥";
  if (score >= 40) return "⚡";
  return "🔹";
}

export default function ResultCard({ lead }: { lead: Lead }) {
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Tihi fallback ako clipboard API nije podržan
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between gap-3 hover:border-accent/40 transition-colors">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold leading-tight">{lead.name}</div>
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

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <span>⭐ {lead.rating !== null ? lead.rating.toFixed(1) : "Nije dostupno"}</span>
          <span>💬 {lead.reviewCount !== null ? `${lead.reviewCount} recenzija` : "Nema recenzija"}</span>
          <span className={lead.website ? "text-green-400 font-medium" : "text-amber-400 font-medium"}>
            {lead.website ? "🌐 Ima website" : "❌ No website"}
          </span>
          <span>📞 {lead.phone ?? "Telefon nije dostupan"}</span>
        </div>

        <div className="text-xs text-muted/80 bg-bg/50 border border-border/50 rounded-lg px-2.5 py-1.5">
          {lead.scoreReasons.join(" · ")}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40 mt-1">
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
