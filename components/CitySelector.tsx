"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CITIES, POPULAR_CITIES, normalizeCityName, type CityOption } from "@/lib/cities";

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  disabled?: boolean;
}

export default function CitySelector({ value, onChange, disabled }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sinhronizuj searchTerm kada se prop `value` promijeni izvana
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Filtriranje gradova prema unesenom terminu
  const filteredCities = useMemo(() => {
    const norm = normalizeCityName(searchTerm);
    if (!norm) {
      return CITIES;
    }

    const startsWith: CityOption[] = [];
    const contains: CityOption[] = [];

    for (const city of CITIES) {
      if (city.normalized.startsWith(norm)) {
        startsWith.push(city);
      } else if (city.normalized.includes(norm)) {
        contains.push(city);
      }
    }

    return [...startsWith, ...contains];
  }, [searchTerm]);

  // Zatvaranje dropdown-a kada se klikne van komponente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Skroluj aktivni element u vidokrug
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(cityName: string) {
    setSearchTerm(cityName);
    onChange(cityName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    setIsOpen(true);
    setHighlightedIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCities.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredCities.length) {
        handleSelect(filteredCities[highlightedIndex].name);
      } else if (searchTerm.trim()) {
        handleSelect(searchTerm.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleClear() {
    setSearchTerm("");
    onChange("");
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  const isExactPresetMatch = CITIES.some(
    (c) => c.normalized === normalizeCityName(searchTerm)
  );

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor="city-input" className="text-sm text-muted">
          Grad / Opština <span className="text-xs text-muted/60">(BiH)</span>
        </label>
        {value && (
          <span className="text-[11px] text-accent font-medium">
            Odabrano: {value}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id="city-input"
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          required
          disabled={disabled}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Unesite ili izaberite grad (npr. Visoko, Travnik, Zenica)..."
          className="w-full bg-bg border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {/* Pin ikona lijevo */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-sm">
          📍
        </div>

        {/* Dugme za brisanje ili dropdown strelica desno */}
        {searchTerm ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs p-1 rounded transition-colors"
            title="Očisti unos"
          >
            ✕
          </button>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs p-1 rounded transition-colors"
          >
            ▼
          </button>
        )}
      </div>

      {/* Dropdown lista */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-100">
          {/* Brzi odabir popularnih gradova ako je unos prazan */}
          {!normalizeCityName(searchTerm) && (
            <div className="p-3 border-b border-border/60 bg-bg/40">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Popularni gradovi
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className="text-xs px-2.5 py-1 rounded-md bg-surface border border-border hover:border-accent hover:text-accent font-medium transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zaglavlje liste sa brojem rezultata */}
          <div className="px-3 py-1.5 text-[11px] text-muted border-b border-border/40 bg-bg/20 flex justify-between items-center">
            <span>Dostupno gradova: {filteredCities.length}</span>
            <span className="text-[10px] text-muted/70">100+ opština u bazi</span>
          </div>

          {/* Lista gradova */}
          <ul
            ref={listRef}
            role="listbox"
            className="overflow-y-auto max-h-60 p-1 divide-y divide-border/20"
          >
            {/* Ako korisnik unosi custom grad koji nije u predefinisanoj listi */}
            {searchTerm.trim() && !isExactPresetMatch && (
              <li
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(searchTerm.trim())}
                className="px-3 py-2 text-xs text-accent hover:bg-accent/10 rounded-lg cursor-pointer flex items-center justify-between font-medium"
              >
                <span>🔎 Traži prilagođeni grad: &quot;<strong>{searchTerm.trim()}</strong>&quot;</span>
                <span className="text-[10px] bg-accent/20 px-1.5 py-0.5 rounded text-accent">ENTER</span>
              </li>
            )}

            {filteredCities.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted">
                Nema pronađenog grada u bazi za &quot;{searchTerm}&quot;.
                <br />
                Pritisnite Enter da pretražite kao prilagođeni unos.
              </li>
            ) : (
              filteredCities.map((city, idx) => {
                const isSelected = normalizeCityName(value) === city.normalized;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={city.name}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(city.name)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? "bg-accent/15 text-accent font-medium"
                        : isSelected
                        ? "bg-surface text-white font-medium"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{city.name}</span>
                      {city.popular && (
                        <span className="text-[10px] text-muted/60 bg-border/40 px-1.5 py-0.5 rounded">
                          popularno
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="text-accent text-xs">✓</span>}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
