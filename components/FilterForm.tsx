"use client";

import CitySelector from "@/components/CitySelector";
import { CATEGORY_OPTIONS } from "@/lib/types";
import type { SearchParamsInput, WebsiteFilter } from "@/lib/types";

interface Props {
  value: SearchParamsInput;
  onChange: (value: SearchParamsInput) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function FilterForm({ value, onChange, onSubmit, loading }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-surface border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end shadow-sm"
    >
      <div className="sm:col-span-2 lg:col-span-2">
        <CitySelector
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
        <label className="text-sm text-muted">Kategorija</label>
        <select
          value={value.category}
          disabled={loading}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
        <label className="text-sm text-muted">Min. ocjena</label>
        <input
          type="number"
          step="0.1"
          min={0}
          max={5}
          disabled={loading}
          value={value.minRating}
          onChange={(e) => onChange({ ...value, minRating: Number(e.target.value) })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
        <label className="text-sm text-muted">Min. recenzija</label>
        <input
          type="number"
          min={0}
          disabled={loading}
          value={value.minReviews}
          onChange={(e) => onChange({ ...value, minReviews: Number(e.target.value) })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-1">
        <label className="text-sm text-muted">Website</label>
        <select
          value={value.websiteFilter}
          disabled={loading}
          onChange={(e) => onChange({ ...value, websiteFilter: e.target.value as WebsiteFilter })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="any">Svi (Any)</option>
          <option value="no_website">Bez web stranice (No website)</option>
          <option value="has_website">Ima web stranicu (Has website)</option>
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-6 flex items-center justify-between pt-1">
        <button
          type="submit"
          disabled={loading || !value.city.trim()}
          className="w-full sm:w-auto bg-accent hover:bg-accentSoft transition-all text-bg font-semibold rounded-lg px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-accent/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
              Pretražujem Google Places...
            </span>
          ) : (
            "🔎 PRONAĐI LEADOVE"
          )}
        </button>

        <span className="hidden sm:inline-block text-xs text-muted/60">
          Koristi Places API (New) sa strogom geo-validacijom
        </span>
      </div>
    </form>
  );
}
