"use client";

import { useMemo, useState } from "react";
import type { Lead, SortKey } from "@/lib/types";
import ResultCard from "./ResultCard";

function toCsv(leads: Lead[]): string {
  const header = [
    "name",
    "rating",
    "review_count",
    "address",
    "phone",
    "website",
    "maps_url",
    "lead_score",
    "distance_km",
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.rating ?? "",
      l.reviewCount ?? "",
      l.address ?? "",
      l.phone ?? "",
      l.website ?? "",
      l.mapsUrl ?? "",
      l.leadScore,
      typeof l.distanceKm === "number" ? l.distanceKm : "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function downloadCsv(leads: Lead[], cityName?: string) {
  const csv = toCsv(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const fileName = cityName
    ? `leads-${cityName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`
    : "leads.csv";
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  leads: Lead[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  resolvedCity?: {
    name: string;
    radiusKm: number;
  } | null;
  totalBeforeFilter?: number;
  totalAfterGeoFilter?: number;
}

export default function ResultsList({
  leads,
  hasMore,
  loadingMore,
  onLoadMore,
  resolvedCity,
  totalBeforeFilter,
  totalAfterGeoFilter,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      switch (sortKey) {
        case "rating":
          return (b.rating ?? -1) - (a.rating ?? -1);
        case "reviews":
          return (b.reviewCount ?? -1) - (a.reviewCount ?? -1);
        case "name":
          return a.name.localeCompare(b.name);
        case "score":
        default:
          return b.leadScore - a.leadScore;
      }
    });
    return copy;
  }, [leads, sortKey]);

  if (leads.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center text-muted">
        <p className="text-base font-medium">Pronađeno je 0 rezultata za zadane filtere.</p>
        <p className="text-xs text-muted/70 mt-1.5">
          Pokušajte smanjiti minimalnu ocjenu ili broj recenzija, ili postavite Website filter na &apos;Any&apos;.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface/60 border border-border rounded-xl p-3.5 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {leads.length} verifikovanih rezultata
            {typeof totalBeforeFilter === "number" && totalBeforeFilter !== leads.length && (
              <span className="text-xs text-muted font-normal ml-1.5">
                (od {totalBeforeFilter} dohvaćenih sa Google API-ja)
              </span>
            )}
          </span>
          {resolvedCity && (
            <span className="text-xs text-muted bg-bg border border-border rounded-md px-2 py-0.5">
              📍 {resolvedCity.name} (radijus ~{resolvedCity.radiusKm} km)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">Sortiraj po:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="score">Lead Score (Preporučeno)</option>
            <option value="rating">Google ocjena</option>
            <option value="reviews">Broj recenzija</option>
            <option value="name">Naziv biznisa</option>
          </select>
          <button
            onClick={() => downloadCsv(sorted, resolvedCity?.name)}
            className="text-sm bg-bg border border-border rounded-lg px-3 py-1.5 hover:border-accent/50 hover:text-accent transition-colors font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((lead) => (
          <ResultCard key={lead.id} lead={lead} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-sm bg-surface border border-border rounded-lg px-5 py-2.5 hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Učitavam..." : "Učitaj još rezultata"}
          </button>
        </div>
      )}
    </div>
  );
}
