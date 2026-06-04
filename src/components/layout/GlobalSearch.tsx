"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Loader2, Search, Users } from "lucide-react";

type SkillResult = {
  id: string;
  name: string;
  slug: string;
  canonicalDescription: string | null;
  isCertified: boolean;
  category: { id: string; name: string } | null;
  _count: { holders: number; sessions: number; notions: number };
};

type UserResult = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  accountLevel: number;
  tutorRatingAvg: string | null;
  sessionsTaught: number;
  _count: { skills: number };
};

type SearchResults = {
  skills: SkillResult[];
  users: UserResult[];
  totals: { skills: number; users: number };
};

const AVATAR_COLORS = [
  "bg-pistache/40 text-deep-green",
  "bg-powder text-deep-green",
  "bg-peach/20 text-orange-800",
];

function userDisplayName(u: UserResult) {
  if (u.displayName) return u.displayName;
  if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
  return u.username ?? "—";
}

function userInitials(u: UserResult) {
  return userDisplayName(u).slice(0, 1).toUpperCase();
}

function avatarColor(id: string) {
  return AVATAR_COLORS[(id.charCodeAt(0) + (id.charCodeAt(1) ?? 0)) % AVATAR_COLORS.length];
}

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults(null);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}&limit=4`);
        if (!res.ok) throw new Error();
        const data: SearchResults = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function goToResults() {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const hasResults = results && (results.skills.length > 0 || results.users.length > 0);
  const showDrop = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative flex w-full max-w-[440px]">
      <label className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 transition-colors focus-within:border-foreground/20 focus-within:bg-white focus-within:ring-2 focus-within:ring-foreground/5">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results && query.trim().length >= 2) setOpen(true); }}
          placeholder="Rechercher compétences, utilisateurs…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>

      {showDrop && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-hairline bg-surface shadow-lg">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-muted-ink">Aucun résultat pour « {query} »</p>
          ) : (
            <>
              {results.skills.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-ink">
                    Compétences
                  </p>
                  <ul>
                    {results.skills.map((skill) => (
                      <li key={skill.id}>
                        <button
                          type="button"
                          onClick={() => { setOpen(false); router.push(`/competences`); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pistache/20 text-deep-green">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{skill.name}</p>
                            {skill.category && (
                              <p className="truncate text-xs text-muted-ink">{skill.category.name}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-ink">
                            {skill._count.holders} détenteur{skill._count.holders !== 1 ? "s" : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.skills.length > 0 && results.users.length > 0 && (
                <div className="mx-4 border-t border-hairline" />
              )}

              {results.users.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-ink">
                    Utilisateurs
                  </p>
                  <ul>
                    {results.users.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => { setOpen(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                        >
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarUrl}
                              alt={userDisplayName(user)}
                              className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-black/10"
                            />
                          ) : (
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-black/10 ${avatarColor(user.id)}`}>
                              {userInitials(user)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{userDisplayName(user)}</p>
                            {user.username && (
                              <p className="truncate text-xs text-muted-ink">@{user.username}</p>
                            )}
                          </div>
                          {user.headline && (
                            <span className="hidden shrink-0 max-w-[120px] truncate text-xs text-muted-ink sm:block">
                              {user.headline}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-hairline">
                <button
                  type="button"
                  onClick={goToResults}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-muted-ink transition-colors hover:bg-canvas hover:text-ink"
                >
                  <span>
                    Voir plus pour «&nbsp;{query}&nbsp;»
                    {(results.totals.skills + results.totals.users) > 0 && (
                      <span className="ml-1.5 text-xs">
                        ({results.totals.skills + results.totals.users} résultat{results.totals.skills + results.totals.users !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
