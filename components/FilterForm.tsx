"use client";

import { CATEGORIES } from "@/lib/types";
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
      className="bg-surface border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end"
    >
      <div className="flex flex-col gap-1.5 lg:col-span-2">
        <label className="text-sm text-muted">Grad</label>
        <input
          type="text"
          required
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          placeholder="Travnik"
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Kategorija</label>
        <select
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Min. ocjena</label>
        <input
          type="number"
          step="0.1"
          min={0}
          max={5}
          value={value.minRating}
          onChange={(e) => onChange({ ...value, minRating: Number(e.target.value) })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Min. recenzija</label>
        <input
          type="number"
          min={0}
          value={value.minReviews}
          onChange={(e) => onChange({ ...value, minReviews: Number(e.target.value) })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">Website</label>
        <select
          value={value.websiteFilter}
          onChange={(e) => onChange({ ...value, websiteFilter: e.target.value as WebsiteFilter })}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="any">Any</option>
          <option value="no_website">No website</option>
          <option value="has_website">Has website</option>
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-accent hover:bg-accentSoft transition-colors text-bg font-semibold rounded-lg px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Tražim..." : "🔎 FIND LEADS"}
        </button>
      </div>
    </form>
  );
}
