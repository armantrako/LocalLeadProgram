"use client";

import { useState } from "react";
import type { AppSettings } from "@/lib/types";

interface Props {
  settings: AppSettings;
  onToggleAuto: (enabled: boolean) => Promise<void>;
  onRunQueue: () => Promise<void>;
  isRunningQueue: boolean;
}

export default function AutoOutreachBanner({
  settings,
  onToggleAuto,
  onRunQueue,
  isRunningQueue,
}: Props) {
  const [loadingToggle, setLoadingToggle] = useState(false);

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      await onToggleAuto(!settings.autoOutreachEnabled);
    } finally {
      setLoadingToggle(false);
    }
  }

  const isEnabled = settings.autoOutreachEnabled;

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-300 shadow-lg ${
        isEnabled
          ? "bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20"
          : "bg-surface border-border"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status strana */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            {isEnabled ? (
              <>
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent" />
              </>
            ) : (
              <span className="inline-flex rounded-full h-3.5 w-3.5 bg-muted/60" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-md ${
                  isEnabled
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-muted/10 text-muted border border-border"
                }`}
              >
                {isEnabled ? "AUTO OUTREACH AKTIVAN" : "AUTO OUTREACH PAUZIRAN"}
              </span>
              <span className="text-xs text-muted">
                {isEnabled
                  ? "Sistem šalje poruke automatski prema limitima"
                  : "Slanje je u ručnom načinu rada"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted/80 mt-1">
              <span>📅 Dnevni limit: <strong>{settings.maxDailyOutreach}</strong></span>
              <span>•</span>
              <span>⏱️ Satni limit: <strong>{settings.maxHourlyOutreach}</strong></span>
              <span>•</span>
              <span>⏳ Kašnjenje: <strong>{settings.minDelaySeconds}s</strong></span>
              <span>•</span>
              <span>📑 Template: <code className="text-accent/90">{settings.activeTemplate}</code></span>
            </div>
          </div>
        </div>

        {/* Dugmad */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onRunQueue}
            disabled={isRunningQueue}
            className="flex-1 sm:flex-none text-xs bg-bg border border-border hover:border-accent/60 hover:text-white px-3.5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            title="Obradi sve pripremljene leadove iz queue-a"
          >
            {isRunningQueue ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Slanje...
              </span>
            ) : (
              "⚡ Pokreni Queue Sada"
            )}
          </button>

          <button
            onClick={handleToggle}
            disabled={loadingToggle}
            className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm ${
              isEnabled
                ? "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
                : "bg-accent hover:bg-accentSoft text-bg font-bold"
            } disabled:opacity-50`}
          >
            {loadingToggle
              ? "Molimo sačekajte..."
              : isEnabled
              ? "⏸️ PAUZIRAJ AUTO OUTREACH"
              : "▶️ UKLJUČI AUTO OUTREACH"}
          </button>
        </div>
      </div>
    </div>
  );
}
