"use client";

import type { OutreachStats } from "@/lib/types";

interface Props {
  stats: OutreachStats;
}

export default function OutreachMetrics({ stats }: Props) {
  const cards = [
    { label: "Poslano danas", value: stats.messagesSent, icon: "📤", color: "text-blue-400" },
    { label: "Isporučeno", value: stats.messagesDelivered, icon: "📬", color: "text-emerald-400" },
    { label: "Odgovori", value: stats.replies, icon: "💬", color: "text-cyan-400" },
    { label: "Zainteresovani", value: stats.interested, icon: "🔥", color: "text-accent" },
    { label: "Nisu zainteresovani", value: stats.notInterested, icon: "🛑", color: "text-muted" },
    { label: "Follow-upovi", value: stats.followups, icon: "🔁", color: "text-amber-400" },
    { label: "Greške", value: stats.errors, icon: "⚠️", color: "text-red-400" },
    { label: "Potencijalni poslovi", value: stats.potentialDeals, icon: "💼", color: "text-purple-400" },
    { label: "Zaključeno (Won)", value: stats.won, icon: "🏆", color: "text-yellow-400" },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tracking-wide uppercase">
            📊 Outreach Danas (Statistika)
          </span>
          <span className="text-[11px] text-muted bg-bg px-2 py-0.5 rounded border border-border">
            Real-time
          </span>
        </div>
        <span className="text-xs text-muted/70">
          Ažurirano automatski sa WhatsApp API-ja
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-bg/60 border border-border/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center hover:border-border transition-colors"
          >
            <div className="text-sm mb-1">{c.icon}</div>
            <div className={`text-xl font-bold leading-tight ${c.color}`}>
              {c.value}
            </div>
            <div className="text-[10px] text-muted font-medium mt-0.5 leading-snug line-clamp-1">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
