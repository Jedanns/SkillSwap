"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Star,
  BookOpen,
  Award,
  X,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Layers,
  Bell,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  Users,
  Lock,
  ShieldCheck,
} from "lucide-react";

// Types

type Tier = "HOLDER" | "EXPERT" | "MASTER";

interface Category {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
  slug: string;
  canonicalDescription?: string;
  isCertified: boolean;
  category: Category;
  notions?: { id?: string; title: string; description?: string }[];
}

interface UserSkill {
  id: string;
  tier: Tier;
  level: number;
  xp: number;
  canTeach: boolean;
  skill: Skill & { _count?: { holders: number; sessions: number } };
}

interface CatalogSkill {
  id: string;
  name: string;
  slug: string;
  canonicalDescription?: string;
  isCertified: boolean;
  category: Category;
  _count: { holders: number; sessions: number; notions?: number };
}

// Helpers

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  HOLDER: { label: "Holder", color: "text-muted-ink", bg: "bg-[#f0f0ee]", icon: BookOpen },
  EXPERT: { label: "Expert", color: "text-[#1a6b9c]", bg: "bg-powder/40", icon: Star },
  MASTER: { label: "Master", color: "text-deep-green", bg: "bg-pistache/40", icon: Award },
};

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function XpBar({ xp, tier }: { xp: number; tier: Tier }) {
  const caps: Record<Tier, number> = { HOLDER: 250, EXPERT: 700, MASTER: 1500 };
  const cap = caps[tier];
  const pct = Math.min((xp / cap) * 100, 100);
  const colors: Record<Tier, string> = { HOLDER: "bg-muted-ink/40", EXPERT: "bg-powder", MASTER: "bg-pistache" };
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-hairline overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colors[tier]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Add Skill Modal

function AddSkillModal({
  userSkillIds,
  onAdd,
  onClose,
}: {
  userSkillIds: Set<string>;
  onAdd: (skill: CatalogSkill) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSkill[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [addError, setAddError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      fetch(`/api/skills${qs}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: unknown) => {
          if (Array.isArray(data)) setResults(data as CatalogSkill[]);
        })
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const noExactMatch = query.trim().length > 0 && !results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase(),
  );

  async function handleAdd(skill: CatalogSkill) {
    if (skill.isCertified) return;
    setAdding(skill.id);
    setAddError("");
    try {
      const res = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id }),
      });
      if (res.ok || res.status === 409) {
        setAdded((prev) => new Set(prev).add(skill.id));
        onAdd(skill);
      } else {
        setAddError("Impossible d'ajouter cette compétence, réessayez.");
      }
    } catch {
      setAddError("Impossible d'ajouter cette compétence, réessayez.");
    } finally {
      setAdding(null);
    }
  }

  if (showCreate) {
    return (
      <CreateSkillModal
        initialName={query}
        onCreated={(skill) => { onAdd(skill); onClose(); }}
        onBack={() => setShowCreate(false)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl border border-hairline bg-surface shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-ink">Ajouter une compétence</h2>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors">
            <X className="h-4 w-4 text-muted-ink" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher React, Python, Figma..."
              className="w-full rounded-xl border border-hairline bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
            />
          </div>
        </div>

        {addError && (
          <p className="mx-6 mb-2 rounded-lg bg-peach/20 px-3 py-2 text-xs font-medium text-ink">{addError}</p>
        )}

        <div className="max-h-72 overflow-y-auto px-3 pb-2">
          {results.length === 0 && !noExactMatch ? (
            <p className="py-8 text-center text-sm text-muted-ink">Aucune compétence trouvée</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((skill) => {
                const isOwned = userSkillIds.has(skill.id) || added.has(skill.id);
                const isLoading = adding === skill.id;
                const isCertified = skill.isCertified;
                return (
                  <li key={skill.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-canvas transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{skill.name}</p>
                        {isCertified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-pistache/30 px-1.5 py-0.5 text-[10px] font-semibold text-deep-green">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Certifiée
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-ink">{skill.category?.name ?? "Sans catégorie"} · {skill._count.holders} détenteurs</p>
                    </div>
                    {isOwned ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-pistache/30 px-2.5 py-1 text-xs font-semibold text-deep-green">
                        <CheckCircle2 className="h-3 w-3" />
                        Ajoutée
                      </span>
                    ) : isCertified ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-xs font-semibold text-muted-ink cursor-not-allowed">
                        <Lock className="h-3 w-3" />
                        Évaluation requise
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(skill)}
                        disabled={isLoading}
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-60"
                      >
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Ajouter
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {noExactMatch && (
          <div className="border-t border-hairline px-6 py-4">
            <p className="text-sm text-muted-ink">
              <span className="font-semibold text-ink">&quot;{query}&quot;</span> n&apos;existe pas encore dans le catalogue.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Créer cette compétence
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Skill Modal

function CreateSkillModal({
  initialName,
  onCreated,
  onBack,
  onClose,
}: {
  initialName: string;
  onCreated: (skill: CatalogSkill) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notions, setNotions] = useState<{ title: string; description: string }[]>([]);
  const [notionInput, setNotionInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/skills/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => { if (Array.isArray(data)) setCategories(data as Category[]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const noExactCategoryMatch =
    categorySearch.trim().length > 0 &&
    !categories.some((c) => c.name.toLowerCase() === categorySearch.trim().toLowerCase());

  async function handleCreateCategory() {
    const n = categorySearch.trim();
    if (!n) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/skills/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });
      if (res.ok) {
        const cat = await res.json() as Category;
        setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
        setCategoryId(cat.id);
        setCategoryName(cat.name);
        setCategorySearch("");
        setCategoryOpen(false);
      }
    } catch { /* ignore */ } finally {
      setCreatingCategory(false);
    }
  }

  function addNotion() {
    const t = notionInput.trim();
    if (!t) return;
    setNotions((prev) => [...prev, { title: t, description: "" }]);
    setNotionInput("");
  }

  function removeNotion(i: number) {
    setNotions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          notions: notions.length ? notions : undefined,
        }),
      });

      let skill: CatalogSkill;

      if (res.status === 409) {
        const search = await fetch(`/api/skills?q=${encodeURIComponent(name.trim())}`);
        const list = search.ok ? (await search.json() as CatalogSkill[]) : [];
        const existing = list.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
        if (!existing) {
          setErrorMsg("Cette compétence existe déjà mais est introuvable dans le catalogue.");
          setStatus("error");
          return;
        }
        skill = existing;
      } else if (!res.ok) {
        throw new Error();
      } else {
        skill = await res.json() as CatalogSkill;
      }

      const addRes = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id }),
      });

      if (addRes.ok || addRes.status === 409) {
        onCreated(skill);
      } else {
        throw new Error();
      }
    } catch {
      setErrorMsg("Une erreur est survenue, réessayez.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-hairline bg-surface shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center gap-3 border-b border-hairline px-6 py-4">
          <button onClick={onBack} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180 text-muted-ink" />
          </button>
          <h2 className="font-heading text-lg font-bold text-ink flex-1">Créer une compétence</h2>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors">
            <X className="h-4 w-4 text-muted-ink" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nom de la compétence *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ex: React, Machine Learning, Figma..."
              className="w-full rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description (facultatif)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Décrivez brièvement cette compétence..."
              className="w-full resize-none rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Catégorie</label>
            <div ref={categoryRef} className="relative">
              {categoryId ? (
                <div className="flex items-center gap-2 rounded-xl border border-powder bg-powder/10 px-4 py-2.5">
                  <span className="flex-1 text-sm font-medium text-ink">{categoryName}</span>
                  <button
                    type="button"
                    onClick={() => { setCategoryId(""); setCategoryName(""); setCategorySearch(""); }}
                    className="text-muted-ink hover:text-ink transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <input
                  value={categorySearch}
                  onChange={(e) => { setCategorySearch(e.target.value); setCategoryOpen(true); }}
                  onFocus={() => setCategoryOpen(true)}
                  placeholder="Rechercher ou créer une catégorie..."
                  className="w-full rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
                />
              )}
              {categoryOpen && !categoryId && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-hairline bg-surface shadow-lg">
                  {filteredCategories.length === 0 && !noExactCategoryMatch ? (
                    <p className="px-4 py-3 text-sm text-muted-ink">Aucune catégorie</p>
                  ) : (
                    <ul>
                      {filteredCategories.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => { setCategoryId(c.id); setCategoryName(c.name); setCategorySearch(""); setCategoryOpen(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-canvas transition-colors"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {noExactCategoryMatch && (
                    <div className="border-t border-hairline">
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink hover:bg-canvas transition-colors disabled:opacity-60"
                      >
                        {creatingCategory ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-muted-ink" />
                        )}
                        Créer &quot;{categorySearch.trim()}&quot;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Notions abordées
              <span className="ml-1 text-xs font-normal text-muted-ink">(checkboxes de session)</span>
            </label>
            <div className="flex gap-2">
              <input
                value={notionInput}
                onChange={(e) => setNotionInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNotion(); } }}
                placeholder="ex: Hooks, State management..."
                className="flex-1 rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
              />
              <button
                type="button"
                onClick={addNotion}
                className="flex items-center gap-1 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm font-medium text-ink hover:bg-canvas transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {notions.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {notions.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-ink" />
                    <span className="flex-1 text-sm text-ink">{n.title}</span>
                    <button type="button" onClick={() => removeNotion(i)} className="text-muted-ink hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {errorMsg && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>}

          <div className="flex gap-3 pb-1">
            <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-hairline bg-surface py-2.5 text-sm font-medium text-ink hover:bg-canvas transition-colors">
              Retour
            </button>
            <button
              type="submit"
              disabled={status === "loading" || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-white hover:bg-ink/80 transition-colors disabled:opacity-60"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Créer et ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// SkillCard (my skills) — links to the skill page

function SkillCard({ us, onView, onEdit }: { us: UserSkill; onView: () => void; onEdit: () => void }) {
  const caps: Record<Tier, number> = { HOLDER: 250, EXPERT: 700, MASTER: 1500 };
  const nextXp = caps[us.tier];

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-ink">{us.skill.category?.name ?? "Sans catégorie"}</p>
          <h3 className="mt-0.5 truncate font-heading text-lg font-bold text-ink">{us.skill.name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TierBadge tier={us.tier} />
          {us.skill.isCertified && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-pistache/30 px-1.5 py-0.5 text-[10px] font-semibold text-deep-green">
              <ShieldCheck className="h-2.5 w-2.5" />
              Certifiée
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-ink">
        <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />Niv. {us.level}</span>
        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{us.xp} XP</span>
        {us.canTeach && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-pistache/30 px-2 py-0.5 text-deep-green font-semibold">
            Tuteur
          </span>
        )}
      </div>

      <XpBar xp={us.xp} tier={us.tier} />
      <p className="text-right text-xs text-muted-ink">{us.xp} / {nextXp} XP</p>

      <div className="mt-1 flex gap-2">
        <button onClick={onView} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas py-2 text-sm font-semibold text-ink hover:border-powder hover:bg-powder/20 transition-colors">
          <Eye className="h-4 w-4 text-muted-ink" />
          Voir la page
        </button>
        <button onClick={onEdit} title="Éditer ma version" className="flex items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm font-semibold text-ink hover:border-powder hover:bg-powder/20 transition-colors">
          <Pencil className="h-4 w-4 text-muted-ink" />
        </button>
      </div>
    </article>
  );
}

// Catalog Skill Card — links to the skill page

function CatalogSkillCard({ skill, onClick }: { skill: CatalogSkill; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5 transition-all hover:shadow-md hover:border-powder/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-ink">{skill.category?.name ?? "Sans catégorie"}</p>
          <h3 className="mt-0.5 truncate font-heading text-lg font-bold text-ink">{skill.name}</h3>
        </div>
        {skill.isCertified && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-pistache/30 px-2 py-0.5 text-xs font-semibold text-deep-green">
            <ShieldCheck className="h-3 w-3" />
            Certifiée
          </span>
        )}
      </div>

      {skill.canonicalDescription && (
        <p className="text-xs text-muted-ink line-clamp-2">{skill.canonicalDescription}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-ink">
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{skill._count.holders} détenteurs</span>
        <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{skill._count.sessions} sessions</span>
        {skill._count.notions != null && skill._count.notions > 0 && (
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />{skill._count.notions} notions</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 text-xs font-medium text-muted-ink group-hover:text-ink transition-colors">
        Voir la page
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </article>
  );
}

// Tab: Mes Competences

function MesCompetencesTab() {
  const router = useRouter();
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetch("/api/user/skills")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => { if (Array.isArray(data)) setUserSkills(data as UserSkill[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = userSkills.filter((us) =>
    us.skill.name.toLowerCase().includes(search.toLowerCase()) ||
    (us.skill.category?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const userSkillIds = new Set(userSkills.map((us) => us.skill.id));

  function handleAddSkill(skill: CatalogSkill) {
    const alreadyIn = userSkills.some((us) => us.skill.id === skill.id);
    if (alreadyIn) return;
    const newEntry: UserSkill = {
      id: `tmp-${skill.id}`,
      tier: "HOLDER",
      level: 1,
      xp: 0,
      canTeach: true,
      skill: { ...skill, _count: { holders: skill._count.holders, sessions: 0 } },
    };
    setUserSkills((prev) => [newEntry, ...prev]);
  }

  const counts = { HOLDER: 0, EXPERT: 0, MASTER: 0 };
  userSkills.forEach((us) => counts[us.tier]++);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-3">
        {(["MASTER", "EXPERT", "HOLDER"] as Tier[]).map((tier) => {
          const cfg = TIER_CONFIG[tier];
          const Icon = cfg.icon;
          return (
            <div key={tier} className={`flex items-center gap-2 rounded-xl px-4 py-2 ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{counts[tier]} {cfg.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Compétences certifiées</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Dès qu&apos;un détenteur atteint le niveau Expert (niveau 3), la compétence devient certifiée et ne peut plus
              être auto-attribuée. Pour l&apos;obtenir, passez une évaluation avec un expert depuis la page de la compétence.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer mes compétences..."
            className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-ink">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-hairline py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas">
            <BookOpen className="h-6 w-6 text-muted-ink" />
          </div>
          <div>
            <p className="font-semibold text-ink">Aucune compétence</p>
            <p className="mt-1 text-sm text-muted-ink">
              {search ? "Aucun résultat pour cette recherche." : "Commencez par ajouter vos premières compétences."}
            </p>
          </div>
          {!search && (
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-pistache/20 transition-colors">
              <Plus className="h-4 w-4" />
              Ajouter une compétence
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((us) => (
            <SkillCard
              key={us.id}
              us={us}
              onView={() => router.push(`/competences/${us.skill.slug}`)}
              onEdit={() => router.push(`/competences/${us.skill.slug}?edit=1`)}
            />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-peach/20">
            <Bell className="h-6 w-6 text-peach" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-base font-bold text-ink">Vous voulez apprendre une nouvelle compétence ?</h2>
            <p className="mt-0.5 text-sm text-muted-ink">
              Utilisez <span className="font-semibold">Rechercher une compétence</span> pour trouver des tuteurs disponibles.
            </p>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddSkillModal userSkillIds={userSkillIds} onAdd={handleAddSkill} onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}

// Tab: Rechercher une Competence

function RechercherCompetenceTab() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSkill[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      fetch(`/api/skills${qs}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: unknown) => { if (Array.isArray(data)) setResults(data as CatalogSkill[]); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Rechercher React, Python, Figma, Design..."
            className="w-full rounded-xl border border-hairline bg-surface py-3 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
          />
        </div>
        <p className="text-xs text-muted-ink">
          {results.length} compétence{results.length !== 1 ? "s" : ""} dans le catalogue
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-ink">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-hairline py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas">
            <Search className="h-6 w-6 text-muted-ink" />
          </div>
          <div>
            <p className="font-semibold text-ink">Aucune compétence trouvée</p>
            <p className="mt-1 text-sm text-muted-ink">Essayez un autre terme de recherche.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((skill) => (
            <CatalogSkillCard key={skill.id} skill={skill} onClick={() => router.push(`/competences/${skill.slug}`)} />
          ))}
        </div>
      )}
    </>
  );
}

// Main Page

type Tab = "mes-competences" | "rechercher";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "mes-competences", label: "Mes compétences", icon: BookOpen },
  { id: "rechercher", label: "Rechercher une compétence", icon: Search },
];

export default function CompetencesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("mes-competences");

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-ink">Compétences</p>
          <h1 className="mt-1 font-heading text-3xl font-black text-ink">Catalogue de compétences</h1>
          <p className="mt-1 text-sm text-muted-ink">Gérez votre portfolio et explorez les compétences disponibles</p>

          <nav className="mt-6 flex gap-1 rounded-xl border border-hairline bg-canvas p-1 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === id
                    ? "bg-surface shadow-sm text-ink border border-hairline"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {activeTab === "mes-competences" ? <MesCompetencesTab /> : <RechercherCompetenceTab />}
      </div>
    </div>
  );
}
