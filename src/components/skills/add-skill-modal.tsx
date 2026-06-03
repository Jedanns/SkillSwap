"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Plus, Search, X, Zap } from "lucide-react";
import { PingModal } from "./ping-modal";
import { MOCK_CATALOG } from "./mock-data";
import type { CatalogSkill } from "./types";

interface AddSkillModalProps {
  /** IDs of skills the user already owns — used to show "Ajoutée" state. */
  userSkillIds: Set<string>;
  onAdd: (skill: CatalogSkill) => void;
  onClose: () => void;
  /**
   * Override the default mock catalog with a live list (e.g. fetched from API).
   * Falls back to MOCK_CATALOG when undefined.
   */
  catalog?: CatalogSkill[];
}

export function AddSkillModal({
  userSkillIds,
  onAdd,
  onClose,
  catalog = MOCK_CATALOG,
}: AddSkillModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSkill[]>(catalog);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [pingSkill, setPingSkill] = useState<CatalogSkill | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const lower = query.toLowerCase();
    setResults(
      catalog.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.category.name.toLowerCase().includes(lower),
      ),
    );
  }, [query, catalog]);

  async function handleAdd(skill: CatalogSkill) {
    setAdding(skill.id);
    try {
      const res = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id }),
      });
      if (res.ok || res.status === 401) {
        setAdded((prev) => new Set(prev).add(skill.id));
        onAdd(skill);
      }
    } catch {
      // Optimistic fallback in dev / mock mode
      setAdded((prev) => new Set(prev).add(skill.id));
      onAdd(skill);
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      {/* Nested ping modal (higher z-index) */}
      {pingSkill && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setPingSkill(null)}
          />
          <div className="relative z-10 w-full max-w-md">
            <PingModal skill={pingSkill} onClose={() => setPingSkill(null)} />
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onClose}
        />
        <div className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-hairline bg-surface shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pistache/30">
                <Plus className="h-4 w-4 text-deep-green" />
              </div>
              <h2 className="font-heading text-lg font-bold text-ink">
                Ajouter une compétence
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline transition-colors hover:bg-canvas"
            >
              <X className="h-4 w-4 text-muted-ink" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pb-3 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher React, Python, Figma…"
                className="w-full rounded-xl border border-hairline bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto px-3 pb-4">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-ink">
                Aucune compétence trouvée
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {results.map((skill) => {
                  const isOwned = userSkillIds.has(skill.id) || added.has(skill.id);
                  const isLoading = adding === skill.id;
                  return (
                    <li
                      key={skill.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-canvas"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{skill.name}</p>
                        <p className="text-xs text-muted-ink">
                          {skill.category.name} · {skill._count.holders} détenteurs
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {/* Ping is always available — learn any skill */}
                        <button
                          onClick={() => setPingSkill(skill)}
                          className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-peach hover:bg-peach/10"
                        >
                          <Zap className="h-3 w-3 text-peach" />
                          Ping
                        </button>

                        {isOwned ? (
                          <span className="flex items-center gap-1 rounded-lg bg-pistache/30 px-2.5 py-1 text-xs font-semibold text-deep-green">
                            <CheckCircle2 className="h-3 w-3" />
                            Ajoutée
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAdd(skill)}
                            disabled={isLoading}
                            className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-60"
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Ajouter
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
