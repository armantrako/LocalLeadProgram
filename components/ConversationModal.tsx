"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";

interface Props {
  lead: Lead;
  onClose: () => void;
  onSendReply: (leadId: string, text: string) => Promise<void>;
}

export default function ConversationModal({ lead, onClose, onSendReply }: Props) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = lead.conversation || [];

  // Provjeri postoji li najnoviji AI prijedlog
  const lastIncoming = [...conversation]
    .reverse()
    .find((m) => m.direction === "incoming");
  const suggestedResponse = lastIncoming?.aiSuggestedResponse;

  async function handleSend() {
    if (!replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onSendReply(lead.id, replyText.trim());
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška pri slanju odgovora.");
    } finally {
      setSending(false);
    }
  }

  function useSuggestion() {
    if (suggestedResponse) {
      setReplyText(suggestedResponse);
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
                💬 Razgovor sa {lead.name}
              </span>
              <span className="text-xs bg-bg border border-border px-2 py-0.5 rounded text-accent font-medium">
                {lead.status}
              </span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              📱 {lead.phone || "Nema telefona"} · 📍 {lead.city || lead.address || "BiH"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-lg p-1.5 rounded-lg hover:bg-border/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tijelo konverzacije */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px] max-h-[450px]">
          {conversation.length === 0 ? (
            <div className="m-auto text-center text-muted text-sm py-10">
              <p>Još uvijek nema zabilježenih poruka za ovaj lead.</p>
              <p className="text-xs text-muted/60 mt-1">
                Poruke se bilježe automatski pri slanju ili prijemu preko WhatsApp API-ja.
              </p>
            </div>
          ) : (
            conversation.map((msg) => {
              const isOut = msg.direction === "outgoing";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[82%] ${
                    isOut ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isOut
                        ? "bg-accent/20 border border-accent/30 text-white rounded-br-xs"
                        : "bg-bg border border-border text-white rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {msg.aiClassification && (
                      <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-accent font-medium">
                        <span>🤖 Klasifikacija:</span>
                        <span className="bg-accent/15 px-1.5 py-0.5 rounded">
                          {msg.aiClassification}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-muted/70 mt-1 px-1">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOut && (
                      <span>
                        • {msg.status === "read" ? "Pročitano ✓✓" : msg.status === "delivered" ? "Isporučeno ✓" : "Poslano"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Prijedlog odgovora ako postoji */}
        {suggestedResponse && (
          <div className="px-4 py-2.5 bg-accent/10 border-t border-accent/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-accent/90 line-clamp-1">
              <span>💡</span>
              <span>
                <strong>AI Prijedlog:</strong> {suggestedResponse}
              </span>
            </div>
            <button
              onClick={useSuggestion}
              className="shrink-0 bg-accent text-bg font-semibold px-2.5 py-1 rounded text-xs hover:bg-accentSoft transition-colors"
            >
              Umetni prijedlog ↵
            </button>
          </div>
        )}

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Polje za slanje odgovora */}
        <div className="p-3 border-t border-border bg-bg/50 flex gap-2 items-center">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending || lead.doNotContact}
            placeholder={
              lead.doNotContact
                ? "Lead je označen kao DO NOT CONTACT. Slanje je onemogućeno."
                : "Upišite odgovor klijentu..."
            }
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !replyText.trim() || lead.doNotContact}
            className="bg-accent hover:bg-accentSoft text-bg font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Šaljem..." : "Pošalji"}
          </button>
        </div>
      </div>
    </div>
  );
}
