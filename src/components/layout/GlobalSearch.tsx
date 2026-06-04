"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, GraduationCap, Loader2, Rss, Search, User } from "lucide-react";
import { profileDisplayName } from "@/lib/profile/display";

type Results = {
  skills: { id: string; name: string; slug: string; isCertified: boolean; _count: { holders: number } }[];
  students: { id: string; username: string | null; firstName: string | null; lastName: string | null; displayName: string | null; avatarUrl: string | null; headline: string | null }[];
  sessions: { id: string; title: string; status: string; skill: { name: string } }[];
  posts: { id: string; content: string; author: { username: string | null; firstName: string | null; lastName: string | null; displayName: string | null } }[];
};

const EMPTY: Results = { skills: [], students: [], sessions: [], posts: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : EMPTY))
        .then((d: Results) => setResults(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  const total = results.skills.length + results.students.length + results.sessions.length + results.posts.length;

  return (
    <div ref={containerRef} className="relative w-full max-w-[440px]">
      <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 transition-colors focus-within:border-foreground/20 focus-within:bg-white focus-within:ring-2 focus-within:ring-foreground/5">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher compétences, étudiants, sessions…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
      </label>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-lg">
          {total === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucun résultat pour « {q} »</p>
          ) : (
            <div className="space-y-2">
              {results.skills.length > 0 && (
                <Group label="Compétences">
                  {results.skills.map((s) => (
                    <Row key={s.id} icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} onClick={() => go(`/competences/${s.slug}`)}>
                      <span className="truncate">{s.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{s._count.holders} détenteur{s._count.holders !== 1 ? "s" : ""}{s.isCertified ? " · certifiée" : ""}</span>
                    </Row>
                  ))}
                </Group>
              )}
              {results.students.length > 0 && (
                <Group label="Étudiants">
                  {results.students.map((p) => (
                    <Row key={p.id} icon={<User className="h-4 w-4 text-muted-foreground" />} onClick={() => p.username && go(`/u/${p.username}`)}>
                      <span className="truncate">{profileDisplayName(p)}</span>
                      {p.headline && <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">{p.headline}</span>}
                    </Row>
                  ))}
                </Group>
              )}
              {results.sessions.length > 0 && (
                <Group label="Sessions">
                  {results.sessions.map((s) => (
                    <Row key={s.id} icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />} onClick={() => go(`/sessions`)}>
                      <span className="truncate">{s.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{s.skill.name}</span>
                    </Row>
                  ))}
                </Group>
              )}
              {results.posts.length > 0 && (
                <Group label="Actualités">
                  {results.posts.map((p) => (
                    <Row key={p.id} icon={<Rss className="h-4 w-4 text-muted-foreground" />} onClick={() => go(`/feed`)}>
                      <span className="truncate">{p.content.slice(0, 60)}</span>
                    </Row>
                  ))}
                </Group>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Row({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/60">
      <span className="shrink-0">{icon}</span>
      {children}
    </button>
  );
}
