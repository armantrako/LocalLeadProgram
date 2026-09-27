"use client";

import type { AuditLogEntry } from "@/lib/types";

interface Props {
  logs: AuditLogEntry[];
  onRefresh: () => void;
}

export default function AuditLogView({ logs, onRefresh }: Props) {
  function getActionBadge(action: string) {
    switch (action) {
      case "WHATSAPP_SENT":
        return <span className="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded text-[11px] font-semibold">📤 POSLANO</span>;
      case "WHATSAPP_SEND_ATTEMPT":
        return <span className="text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded text-[11px]">⏳ POKUŠAJ</span>;
      case "WHATSAPP_FAILED":
        return <span className="text-red-400 bg-red-500/15 px-2 py-0.5 rounded text-[11px] font-semibold">❌ GREŠKA</span>;
      case "REPLY_RECEIVED":
        return <span className="text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded text-[11px] font-semibold">💬 ODGOVOR</span>;
      case "DO_NOT_CONTACT":
        return <span className="text-red-400 bg-red-500/20 px-2 py-0.5 rounded text-[11px] font-bold">🚫 DO NOT CONTACT</span>;
      case "AI_MESSAGE_GENERATED":
        return <span className="text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded text-[11px]">✍️ PORUKA</span>;
      case "AI_ANALYSIS_COMPLETED":
        return <span className="text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded text-[11px]">🤖 ANALIZA</span>;
      case "FOLLOWUP_SCHEDULED":
        return <span className="text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded text-[11px]">🔁 FOLLOW-UP</span>;
      default:
        return <span className="text-muted bg-border/40 px-2 py-0.5 rounded text-[11px]">{action}</span>;
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>📜</span> Audit Dnevnik Događaja
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Potpuna revizija svih automatskih i ručnih outreach aktivnosti, webhook odgovora i statusa.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs bg-bg hover:bg-surface border border-border hover:border-accent text-white px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
        >
          <span>🔄</span> Osvježi
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-muted text-xs">
          Još uvijek nema zabilježenih akcija u audit dnevniku.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-bg/60 border-b border-border text-muted font-medium uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Vrijeme</th>
                <th className="py-2.5 px-3">Akcija</th>
                <th className="py-2.5 px-3">Biznis</th>
                <th className="py-2.5 px-3">Kanal / Izvor</th>
                <th className="py-2.5 px-3">Detalji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-bg/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white max-w-[180px] truncate">
                    {log.businessName}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted text-[11px]">
                    <span className="uppercase font-mono text-[10px] bg-bg px-1.5 py-0.5 rounded border border-border">
                      {log.channel} · {log.source}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-muted/90 max-w-[320px] truncate text-[11px]">
                    {log.error ? (
                      <span className="text-red-400 font-medium">⚠️ {log.error}</span>
                    ) : (
                      log.details || "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
