"use client";

import { useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import type { Lead, LeadStatus } from "@/lib/types";

interface Props {
  leads: Lead[];
  onAnalyze: (lead: Lead) => void;
  onGenerateMessage: (lead: Lead) => void;
  onSendWhatsApp: (lead: Lead) => void;
  onViewConversation: (lead: Lead) => void;
  onScheduleFollowup: (lead: Lead) => void;
  onDoNotContact: (lead: Lead) => void;
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Svi leadovi" },
  { value: "READY_TO_SEND", label: "Spremni za slanje" },
  { value: "MESSAGE_READY", label: "Poruka pripremljena" },
  { value: "SENT", label: "Poslano" },
  { value: "REPLIED", label: "Odgovoreno" },
  { value: "INTERESTED", label: "Zainteresovani 🔥" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "NOT_INTERESTED", label: "Nisu zainteresovani" },
  { value: "DO_NOT_CONTACT", label: "DO NOT CONTACT" },
  { value: "ERROR", label: "Greške" },
];

export default function OutreachTable({
  leads,
  onAnalyze,
  onGenerateMessage,
  onSendWhatsApp,
  onViewConversation,
  onScheduleFollowup,
  onDoNotContact,
}: Props) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "DO_NOT_CONTACT" && lead.doNotContact) return true;
        if (lead.status !== statusFilter) return false;
      }

      // Pretraga po nazivu, gradu, telefonu
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchCity = (lead.city || lead.address || "").toLowerCase().includes(q);
        const matchPhone = (lead.phone || "").includes(q);
        if (!matchName && !matchCity && !matchPhone) return false;
      }

      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      {/* Kontrolna traka za pretragu i filtere */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <span className="text-muted text-sm">🔎</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtriraj po nazivu, gradu ili telefonu..."
            className="w-full bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <span className="text-xs text-muted whitespace-nowrap bg-bg border border-border px-2.5 py-1.5 rounded-lg">
            Ukupno: <strong>{filtered.length}</strong> / {leads.length}
          </span>
        </div>
      </div>

      {/* Prikaz tabele */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center text-muted">
          <p className="text-sm font-medium">Nema pronađenih leadova za odabrane filtere.</p>
          <p className="text-xs text-muted/60 mt-1">
            Pronađite nove kandidate u tabu &quot;Pronađi leadove&quot; ili promijenite filtere.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg/70 border-b border-border text-muted font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Biznis & Kontakt</th>
                  <th className="py-3 px-3">Grad</th>
                  <th className="py-3 px-2 text-center">Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Poruka / Template</th>
                  <th className="py-3 px-3">Zadnji kontakt</th>
                  <th className="py-3 px-3">Sljedeći follow-up</th>
                  <th className="py-3 px-3.5 text-right">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((lead) => {
                  const conversationCount = lead.conversation?.length || 0;
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-bg/40 transition-colors ${
                        lead.doNotContact
                          ? "opacity-60 bg-red-950/5"
                          : lead.status === "INTERESTED"
                          ? "bg-accent/5 font-medium"
                          : ""
                      }`}
                    >
                      {/* Biznis & Telefon */}
                      <td className="py-3 px-3.5 max-w-[200px]">
                        <div className="font-semibold text-white truncate" title={lead.name}>
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                          <span>📞 {lead.phone || "Nema broja"}</span>
                          {lead.website && (
                            <span className="text-accent text-[10px]" title={lead.website}>
                              🌐
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grad */}
                      <td className="py-3 px-3 whitespace-nowrap text-muted">
                        {lead.city || "BiH"}
                      </td>

                      {/* Lead Score */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="font-bold text-white bg-bg border border-border px-1.5 py-0.5 rounded">
                          {lead.leadScore}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={lead.status || "NEW"} />
                      </td>

                      {/* Poruka & Template */}
                      <td className="py-3 px-3 max-w-[220px]">
                        {lead.generatedMessage ? (
                          <div className="line-clamp-2 text-muted/90 leading-tight">
                            {lead.generatedMessage}
                          </div>
                        ) : (
                          <span className="text-muted/50 italic">Nije generisana</span>
                        )}
                        {lead.selectedTemplate && (
                          <span className="text-[10px] text-accent/80 block mt-0.5 font-mono">
                            {lead.selectedTemplate}
                          </span>
                        )}
                      </td>

                      {/* Zadnji kontakt */}
                      <td className="py-3 px-3 whitespace-nowrap text-muted/80">
                        {lead.lastContactAt
                          ? new Date(lead.lastContactAt).toLocaleDateString([], {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>

                      {/* Sljedeći follow-up */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {lead.nextFollowupAt ? (
                          <span className="text-amber-400 font-medium">
                            {new Date(lead.nextFollowupAt).toLocaleDateString([], {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted/50">-</span>
                        )}
                      </td>

                      {/* Akcije */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onAnalyze(lead)}
                            className="bg-bg hover:bg-surface border border-border hover:border-accent text-white px-2 py-1 rounded transition-colors text-[11px]"
                            title="AI analiza i pregled poruke"
                          >
                            🤖 Pregled
                          </button>

                          <button
                            type="button"
                            onClick={() => onSendWhatsApp(lead)}
                            disabled={lead.doNotContact}
                            className="bg-accent/15 hover:bg-accent text-accent hover:text-bg font-semibold border border-accent/40 px-2 py-1 rounded transition-all text-[11px] disabled:opacity-40"
                            title="Pošalji WhatsApp"
                          >
                            💬 Pošalji
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewConversation(lead)}
                            className="bg-bg hover:bg-surface border border-border hover:border-accent text-muted hover:text-white px-2 py-1 rounded transition-colors text-[11px]"
                            title="Historija razgovora"
                          >
                            👁️ {conversationCount > 0 && `(${conversationCount})`}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDoNotContact(lead)}
                            className={`px-1.5 py-1 rounded text-[11px] transition-colors ${
                              lead.doNotContact
                                ? "bg-red-500/20 text-red-400"
                                : "text-muted hover:text-red-400 hover:bg-red-500/10"
                            }`}
                            title="Do Not Contact"
                          >
                            🚫
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
