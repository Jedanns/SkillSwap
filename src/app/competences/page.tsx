"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Zap,
  Star,
  BookOpen,
  Award,
  ChevronDown,
  X,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Layers,
  Bell,
  Eye,
  Users,
  TrendingUp,
} from "lucide-react";

//Types 

type Tier = "HOLDER" | "EXPERT" | "MASTER";

interface Skill {
  id: string;
  name: string;
  category: { id: string; name: string };
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
  category: { id: string; name: string };
  _count: { holders: number };
}

//Mock data 

const MOCK_USER_SKILLS: UserSkill[] = [
  {
    id: "us1",
    tier: "EXPERT",
    level: 7,
    xp: 1420,
    canTeach: true,
    skill: {
      id: "sk1",
      name: "React",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 48, sessions: 23 },
    },
  },
  {
    id: "us2",
    tier: "HOLDER",
    level: 2,
    xp: 280,
    canTeach: false,
    skill: {
      id: "sk2",
      name: "Node.js",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 35, sessions: 17 },
    },
  },
  {
    id: "us3",
    tier: "MASTER",
    level: 12,
    xp: 4200,
    canTeach: true,
    skill: {
      id: "sk3",
      name: "TypeScript",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 61, sessions: 44 },
    },
  },
  {
    id: "us4",
    tier: "HOLDER",
    level: 1,
    xp: 80,
    canTeach: false,
    skill: {
      id: "sk4",
      name: "Figma",
      category: { id: "c2", name: "Design" },
      _count: { holders: 29, sessions: 8 },
    },
  },
  {
    id: "us5",
    tier: "EXPERT",
    level: 5,
    xp: 870,
    canTeach: true,
    skill: {
      id: "sk5",
      name: "PostgreSQL",
      category: { id: "c3", name: "Base de données" },
      _count: { holders: 22, sessions: 11 },
    },
  },
];

const MOCK_CATALOG: CatalogSkill[] = [
  { id: "sk6", name: "Vue.js", category: { id: "c1", name: "Développement web" }, _count: { holders: 31 } },
  { id: "sk7", name: "Python", category: { id: "c4", name: "Programmation" }, _count: { holders: 74 } },
  { id: "sk8", name: "Docker", category: { id: "c5", name: "DevOps" }, _count: { holders: 19 } },
  { id: "sk9", name: "Tailwind CSS", category: { id: "c1", name: "Développement web" }, _count: { holders: 42 } },
  { id: "sk10", name: "GraphQL", category: { id: "c1", name: "Développement web" }, _count: { holders: 16 } },
  { id: "sk11", name: "Machine Learning", category: { id: "c4", name: "Programmation" }, _count: { holders: 11 } },
  { id: "sk12", name: "Kubernetes", category: { id: "c5", name: "DevOps" }, _count: { holders: 8 } },
  { id: "sk13", name: "UX Research", category: { id: "c2", name: "Design" }, _count: { holders: 14 } },
  { id: "sk14", name: "Swift", category: { id: "c4", name: "Programmation" }, _count: { holders: 9 } },
  { id: "sk15", name: "MongoDB", category: { id: "c3", name: "Base de données" }, _count: { holders: 27 } },
];

//Helpers

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
  const caps: Record<Tier, number> = { HOLDER: 500, EXPERT: 2000, MASTER: 10000 };
  const cap = caps[tier];
  const pct = Math.min((xp / cap) * 100, 100);
  const colors: Record<Tier, string> = { HOLDER: "bg-muted-ink/40", EXPERT: "bg-powder", MASTER: "bg-pistache" };
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-hairline overflow-hidden">
      <div className={`h-full rounded-full transition-all ${colors[tier]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

//Ping modal

function PingModal({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, message }),
      });
      if (res.status === 409) {
        setErrorMsg("Vous avez déjà un ping ouvert pour cette compétence.");
        setStatus("error");
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setErrorMsg("Une erreur est survenue, réessayez.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-peach/20">
                <Zap className="h-4 w-4 text-peach" />
              </div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-ink">Ping</span>
            </div>
            <h2 className="font-heading text-xl font-bold text-ink">
              Demander un tutorat
            </h2>
            <p className="mt-0.5 text-sm text-muted-ink">
              Compétence : <span className="font-semibold text-ink">{skill.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors"
          >
            <X className="h-4 w-4 text-muted-ink" />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pistache/30">
              <CheckCircle2 className="h-7 w-7 text-deep-green" />
            </div>
            <p className="font-semibold text-ink">Ping envoyé !</p>
            <p className="text-sm text-muted-ink">
              Un expert en <span className="font-medium">{skill.name}</span> sera notifié.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Message (facultatif)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Bonjour, je cherche un tuteur en ${skill.name}…`}
                rows={4}
                maxLength={400}
                className="w-full resize-none rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
              />
              <p className="mt-1 text-right text-xs text-muted-ink">{message.length}/400</p>
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-hairline bg-surface py-2.5 text-sm font-medium text-ink hover:bg-canvas transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-white hover:bg-ink/80 transition-colors disabled:opacity-60"
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Envoyer le ping
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

//Add skill modal

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
  const [results, setResults] = useState<CatalogSkill[]>(MOCK_CATALOG);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [pingSkill, setPingSkill] = useState<CatalogSkill | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Filter mock catalog locally; in production, debounce API call
    const lower = query.toLowerCase();
    setResults(
      MOCK_CATALOG.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.category.name.toLowerCase().includes(lower),
      ),
    );
  }, [query]);

  async function handleAdd(skill: CatalogSkill) {
    setAdding(skill.id);
    try {
      const res = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id }),
      });
      // Optimistic — works even if API fails (mock mode)
      if (res.ok || res.status === 401) {
        setAdded((prev) => new Set(prev).add(skill.id));
        onAdd(skill);
      }
    } catch {
      setAdded((prev) => new Set(prev).add(skill.id));
      onAdd(skill);
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
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
            <h2 className="font-heading text-lg font-bold text-ink">Ajouter une compétence</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors"
          >
            <X className="h-4 w-4 text-muted-ink" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-3">
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
            <p className="py-8 text-center text-sm text-muted-ink">Aucune compétence trouvée</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((skill) => {
                const isOwned = userSkillIds.has(skill.id) || added.has(skill.id);
                const isLoading = adding === skill.id;
                return (
                  <li
                    key={skill.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-canvas transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{skill.name}</p>
                      <p className="text-xs text-muted-ink">
                        {skill.category.name} · {skill._count.holders} détenteurs
                      </p>
                    </div>
                    {isOwned ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setPingSkill(skill)}
                          className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-peach hover:bg-peach/10 transition-colors"
                        >
                          <Zap className="h-3 w-3 text-peach" />
                          Ping
                        </button>
                        <span className="flex items-center gap-1 rounded-lg bg-pistache/30 px-2.5 py-1 text-xs font-semibold text-deep-green">
                          <CheckCircle2 className="h-3 w-3" />
                          Ajoutée
                        </span>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setPingSkill(skill)}
                          className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-peach hover:bg-peach/10 transition-colors"
                        >
                          <Zap className="h-3 w-3 text-peach" />
                          Ping
                        </button>
                        <button
                          onClick={() => handleAdd(skill)}
                          disabled={isLoading}
                          className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-60"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Ajouter
                        </button>
                      </div>
                    )}
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

//Skill detail modal

function SkillDetailModal({ us, onClose }: { us: UserSkill; onClose: () => void }) {
  const cfg = TIER_CONFIG[us.tier];
  const Icon = cfg.icon;
  const caps: Record<Tier, number> = { HOLDER: 500, EXPERT: 2000, MASTER: 10000 };
  const nextXp = caps[us.tier];
  const pct = Math.min((us.xp / nextXp) * 100, 100);
  const colors: Record<Tier, string> = { HOLDER: "bg-muted-ink/40", EXPERT: "bg-powder", MASTER: "bg-pistache" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-hairline bg-surface shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
        {/* Colored top band */}
        <div className={`h-1.5 w-full ${colors[us.tier]}`} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-ink">{us.skill.category.name}</p>
              <h2 className="mt-0.5 font-heading text-2xl font-black text-ink">{us.skill.name}</h2>
              <div className="mt-2">
                <TierBadge tier={us.tier} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline hover:bg-canvas transition-colors"
            >
              <X className="h-4 w-4 text-muted-ink" />
            </button>
          </div>

          {/* XP section */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Progression</span>
              <span className="text-xs text-muted-ink">{us.xp} / {nextXp} XP</span>
            </div>
            <div className="h-2 w-full rounded-full bg-hairline overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colors[us.tier]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-ink">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Niveau {us.level}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {pct.toFixed(0)}% vers le palier suivant
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {us.skill._count && (
              <>
                <div className="rounded-xl border border-hairline bg-canvas p-3">
                  <p className="text-xs text-muted-ink">Détenteurs</p>
                  <p className="mt-0.5 text-xl font-bold text-ink">{us.skill._count.holders}</p>
                </div>
                <div className="rounded-xl border border-hairline bg-canvas p-3">
                  <p className="text-xs text-muted-ink">Séances de tutorat</p>
                  <p className="mt-0.5 text-xl font-bold text-ink">{us.skill._count.sessions}</p>
                </div>
              </>
            )}
          </div>

          {/* canTeach */}
          {us.canTeach && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-pistache/40 bg-pistache/10 p-3">
              <GraduationCap className="h-5 w-5 shrink-0 text-deep-green" />
              <div>
                <p className="text-sm font-semibold text-deep-green">Vous pouvez enseigner cette compétence</p>
                <p className="text-xs text-muted-ink">Vous apparaissez dans les résultats de recherche de tuteurs.</p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-hairline bg-surface py-2.5 text-sm font-medium text-ink hover:bg-canvas transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

//Skill card

function SkillCard({ us, onView }: { us: UserSkill; onView: () => void }) {
  const cfg = TIER_CONFIG[us.tier];
  const caps: Record<Tier, number> = { HOLDER: 500, EXPERT: 2000, MASTER: 10000 };
  const nextXp = caps[us.tier];

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5 transition-shadow hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-ink">{us.skill.category.name}</p>
          <h3 className="mt-0.5 truncate font-heading text-lg font-bold text-ink">{us.skill.name}</h3>
        </div>
        <TierBadge tier={us.tier} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-ink">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          Niv. {us.level}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {us.xp} XP
        </span>
        {us.skill._count && (
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {us.skill._count.sessions} séances
          </span>
        )}
        {us.canTeach && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-pistache/30 px-2 py-0.5 text-deep-green font-semibold">
            Tuteur
          </span>
        )}
      </div>

      {/* XP bar */}
      <XpBar xp={us.xp} tier={us.tier} />
      <p className="text-right text-xs text-muted-ink">{us.xp} / {nextXp} XP</p>

      {/* Action */}
      <button
        onClick={onView}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas py-2 text-sm font-semibold text-ink hover:border-powder hover:bg-powder/20 transition-colors"
      >
        <Eye className="h-4 w-4 text-muted-ink" />
        Voir les détails
      </button>
    </article>
  );
}

//Main page 

export default function CompetencesPage() {
  const [userSkills, setUserSkills] = useState<UserSkill[]>(MOCK_USER_SKILLS);
  const [search, setSearch] = useState("");
  const [viewTarget, setViewTarget] = useState<UserSkill | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Try to load real data
  useEffect(() => {
    fetch("/api/user/skills")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setUserSkills(data);
      })
      .catch(() => {});
  }, []);

  const filtered = userSkills.filter((us) =>
    us.skill.name.toLowerCase().includes(search.toLowerCase()) ||
    us.skill.category.name.toLowerCase().includes(search.toLowerCase()),
  );

  const userSkillIds = new Set(userSkills.map((us) => us.skill.id));

  function handleAddSkill(skill: CatalogSkill) {
    // Optimistically add to the list
    const alreadyIn = userSkills.some((us) => us.skill.id === skill.id);
    if (alreadyIn) return;
    const newEntry: UserSkill = {
      id: `tmp-${skill.id}`,
      tier: "HOLDER",
      level: 1,
      xp: 0,
      canTeach: false,
      skill: { ...skill, _count: { holders: skill._count.holders, sessions: 0 } },
    };
    setUserSkills((prev) => [newEntry, ...prev]);
  }

  // Summary counts
  const counts = { HOLDER: 0, EXPERT: 0, MASTER: 0 };
  userSkills.forEach((us) => counts[us.tier]++);

  return (
    <>
      <main className="min-h-screen bg-canvas pb-20">
        {/* Hero */}
        <div className="border-b border-hairline bg-surface">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-ink">
                  Mon profil
                </p>
                <h1 className="mt-1 font-heading text-3xl font-black text-ink">
                  Mes compétences
                </h1>
                <p className="mt-1 text-sm text-muted-ink">
                  {userSkills.length} compétence{userSkills.length !== 1 ? "s" : ""} dans votre portfolio
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center gap-2 self-start rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80 transition-colors sm:mt-0 sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Ajouter une compétence
              </button>
            </div>

            {/* Tier summary pills */}
            <div className="mt-6 flex flex-wrap gap-3">
              {(["MASTER", "EXPERT", "HOLDER"] as Tier[]).map((tier) => {
                const cfg = TIER_CONFIG[tier];
                const Icon = cfg.icon;
                return (
                  <div
                    key={tier}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 ${cfg.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className={`text-sm font-semibold ${cfg.color}`}>
                      {counts[tier]} {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Search */}
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer mes compétences…"
              className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink/50 focus:outline-none focus:ring-2 focus:ring-powder"
            />
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
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
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-pistache/20 transition-colors"
                >
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
                  onView={() => setViewTarget(us)}
                />
              ))}
            </div>
          )}

          {/* Ping CTA banner */}
          <div className="mt-10 rounded-2xl border border-hairline bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-peach/20">
                <Bell className="h-6 w-6 text-peach" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-base font-bold text-ink">
                  Vous voulez apprendre une nouvelle compétence ?
                </h2>
                <p className="mt-0.5 text-sm text-muted-ink">
                  Cliquez sur <span className="font-semibold">Ajouter une compétence</span>, puis utilisez le bouton <span className="font-semibold">Ping</span> pour notifier les experts disponibles.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-peach/40 bg-peach/10 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-peach/20 transition-colors"
              >
                <Zap className="h-4 w-4 text-peach" />
                Chercher un tuteur
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {viewTarget && (
        <SkillDetailModal us={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {showAddModal && (
        <AddSkillModal
          userSkillIds={userSkillIds}
          onAdd={handleAddSkill}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
