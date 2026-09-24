"use client";

import { useEffect, useState } from "react";
import FilterForm from "@/components/FilterForm";
import ResultsList from "@/components/ResultsList";
import type { Lead, SearchParamsInput } from "@/lib/types";

const DEFAULT_PARAMS: SearchParamsInput = {
  city: "Visoko",
  category: "Restaurants",
  minRating: 0,
  minReviews: 0,
  websiteFilter: "any",
};

export default function Home() {
  const [params, setParams] = useState<SearchParamsInput>(DEFAULT_PARAMS);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [resolvedCity, setResolvedCity] = useState<{
    name: string;
    radiusKm: number;
  } | null>(null);
  const [totalBeforeFilter, setTotalBeforeFilter] = useState<number | undefined>(undefined);
  const [totalAfterGeoFilter, setTotalAfterGeoFilter] = useState<number | undefined>(undefined);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState<boolean | null>(null);

  async function runSearch(pageToken?: string) {
    const qs = new URLSearchParams({
      city: params.city,
      category: params.category,
      minRating: String(params.minRating),
      minReviews: String(params.minReviews),
      websiteFilter: params.websiteFilter,
    });
    if (pageToken) qs.set("pageToken", pageToken);

    const res = await fetch(`/api/leads?${qs.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Došlo je do greške prilikom pretrage.");
    }
    return data as {
      leads: Lead[];
      mockMode: boolean;
      nextPageToken: string | null;
      resolvedCity?: { name: string; radiusKm: number };
      totalBeforeFilter?: number;
      totalAfterGeoFilter?: number;
    };
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setLeads(null);
    setResolvedCity(null);
    setTotalBeforeFilter(undefined);
    setTotalAfterGeoFilter(undefined);
    setNextPageToken(null);
    try {
      const data = await runSearch();
      setLeads(data.leads);
      setMockMode(data.mockMode);
      setNextPageToken(data.nextPageToken);
      setResolvedCity(data.resolvedCity ?? null);
      setTotalBeforeFilter(data.totalBeforeFilter);
      setTotalAfterGeoFilter(data.totalAfterGeoFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepoznata greška.");
    } finally {
      setLoading(false);
    }
  }

  // Automatski učitaj početnu pretragu za Visoko čim se stranica otvori
  useEffect(() => {
    handleSearch();
  }, []);

  async function handleLoadMore() {
    if (!nextPageToken) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await runSearch(nextPageToken);
      setLeads((prev) => [...(prev ?? []), ...data.leads]);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepoznata greška.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Lead Finder</h1>
        <p className="text-muted text-sm">
          Pronađi stvarne lokalne biznise u tačno određenom gradu pomoću Google Places API (New).
        </p>
        {mockMode && (
          <span className="inline-block w-fit mt-1 text-xs px-2.5 py-1 rounded-full border border-yellow-500/40 text-yellow-400 bg-yellow-500/10 font-medium">
            MOCK MODE — samo za lokalni development bez API ključa
          </span>
        )}
      </header>

      <FilterForm value={params} onChange={setParams} onSubmit={handleSearch} loading={loading} />

      {loading && (
        <div className="text-center text-muted py-12 text-sm flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Pretražujem Google Places API za grad {params.city}...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {leads !== null && !loading && !error && (
        <ResultsList
          leads={leads}
          hasMore={!!nextPageToken}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          resolvedCity={resolvedCity}
          totalBeforeFilter={totalBeforeFilter}
          totalAfterGeoFilter={totalAfterGeoFilter}
        />
      )}
    </main>
  );
}
