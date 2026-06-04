"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";

//Types 

type SessionKind = "TUTORING" | "EVALUATION";
type SessionStatus =
  | "PROPOSED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "AWAITING_FEEDBACK"
  | "COMPLETED"
  | "CANCELLED";

type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  headline?: string | null;
};

type Review = {
  id: string;
  direction: "STUDENT_TO_TUTOR" | "TUTOR_TO_STUDENT";
  rating: number;
  comment: string | null;
  reviewer: Profile;
  reviewee: Profile;
};

type SessionDetail = {
  id: string;
  title: string;
  description: string | null;
  kind: SessionKind;
  status: SessionStatus;
  isPublic: boolean;
  scheduledAt: string;
  durationMinutes: number;
  tutor: Profile & { headline: string | null };
  skill: {
    id: string;
    name: string;
    slug: string;
    canonicalDescription: string | null;
    category: { name: string } | null;
  };
  participants: {
    id: string;
    status: string;
    attended: boolean;
    student: Profile;
  }[];
  reviews?: Review[];
  _count: { participants: number };
};

//Config 

const STATUS_META: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  PROPOSED:          { label: "Proposee",         color: "bg-amber-50 text-amber-700 ring-amber-200",     dot: "bg-amber-400"  },
  CONFIRMED:         { label: "Confirmee",         color: "bg-powder/60 text-deep-green ring-powder",      dot: "bg-deep-green" },
  IN_PROGRESS:       { label: "En cours",          color: "bg-pistache/40 text-deep-green ring-pistache",  dot: "bg-pistache"   },
  AWAITING_FEEDBACK: { label: "Feedback attendu",  color: "bg-peach/20 text-orange-700 ring-peach/60",    dot: "bg-peach"      },
  COMPLETED:         { label: "Terminee",          color: "bg-zinc-100 text-zinc-500 ring-zinc-200",       dot: "bg-zinc-400"   },
  CANCELLED:         { label: "Annulee",           color: "bg-red-50 text-red-500 ring-red-200",           dot: "bg-red-400"    },
};

const KIND_META: Record<SessionKind, { label: string; icon: React.ReactNode }> = {
  TUTORING:   { label: "Tutorat",    icon: <BookOpen className="size-3" /> },
  EVALUATION: { label: "Evaluation", icon: <CheckCircle2 className="size-3" /> },
};

const PARTICIPATION_STATUS_META: Record<string, { label: string; color: string }> = {
  APPROVED:  { label: "Accepte",    color: "text-deep-green bg-pistache/40 ring-pistache" },
  PENDING:   { label: "En attente", color: "text-amber-700 bg-amber-50 ring-amber-200"   },
  INVITED:   { label: "Invite",     color: "text-sky-700 bg-sky-50 ring-sky-200"          },
  DECLINED:  { label: "Refuse",     color: "text-red-500 bg-red-50 ring-red-200"          },
  CANCELLED: { label: "Annule",     color: "text-zinc-400 bg-zinc-100 ring-zinc-200"      },
};

//Helpers 

function displayName(p: Profile) {
  if (p.firstName || p.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return p.username ?? "—";
}

function initials(p: Profile) {
  return displayName(p).slice(0, 1).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3_600_000;
  if (Math.abs(diffH) < 1) return "Maintenant";
  if (diffH > 0 && diffH < 24) return `Dans ${Math.round(diffH)}h`;
  if (diffH < 0 && diffH > -24) return `Il y a ${Math.round(-diffH)}h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

//Avatar 

const AVATAR_COLORS = ["bg-pistache text-deep-green", "bg-powder text-deep-green", "bg-peach/40 text-orange-800"];

function Avatar({ profile, size = "sm" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "size-7", md: "size-9", lg: "size-12" }[size];
  const textClass = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  const colorIdx = (profile.id.charCodeAt(0) + (profile.id.charCodeAt(1) ?? 0)) % AVATAR_COLORS.length;
  if (profile.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatarUrl} alt={displayName(profile)} className={`${sizeClass} rounded-full object-cover ring-1 ring-black/10`} />;
  }
  return (
    <div className={`${sizeClass} ${AVATAR_COLORS[colorIdx]} ${textClass} flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-black/10`}>
      {initials(profile)}
    </div>
  );
}

//Badge 

function Badge({ label, colorClass, dot, icon }: { label: string; colorClass: string; dot?: string; icon?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${colorClass}`}>
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {icon}{label}
    </span>
  );
}

//StarRating

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (readonly ? value : hovered || value) >= star;
        return (
          <button key={star} type="button" disabled={readonly} onClick={() => onChange?.(star)} onMouseEnter={() => !readonly && setHovered(star)} onMouseLeave={() => !readonly && setHovered(0)} className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`} aria-label={`${star} etoile${star > 1 ? "s" : ""}`}>
            <Star className={`size-5 transition-colors ${filled ? "fill-peach text-peach" : "fill-transparent text-zinc-300"}`} />
          </button>
        );
      })}
    </div>
  );
}

// FeedbackSection 

function FeedbackSection({ session }: { session: SessionDetail }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (session.status !== "AWAITING_FEEDBACK" && session.status !== "COMPLETED") return null;

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
        <MessageSquare className="size-3" />Feedback
      </p>

      {session.reviews && session.reviews.length > 0 && (
        <div className="mb-4 space-y-3">
          {session.reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-hairline bg-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar profile={review.reviewer} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-ink">{displayName(review.reviewer)}</p>
                    <p className="text-[10px] text-muted-ink">{review.direction === "STUDENT_TO_TUTOR" ? "vers le tuteur" : "vers l etudiant"}</p>
                  </div>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.comment && <p className="mt-2 text-sm leading-relaxed text-muted-ink">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {session.status === "AWAITING_FEEDBACK" && (
        <div className="rounded-xl border border-peach/40 bg-peach/5 p-4">
          {submitted ? (
            <div className="flex items-center gap-2 text-sm font-medium text-deep-green">
              <CheckCircle2 className="size-4 text-pistache" />Merci pour ton feedback !
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-ink">Donner mon feedback</p>
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-muted-ink">Note globale</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-muted-ink">Commentaire (optionnel)</p>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Decris ton experience de la session..." className="w-full resize-none rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
              </div>
              <button onClick={() => rating > 0 && setSubmitted(true)} disabled={rating === 0} className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-surface transition hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="size-3.5" />Envoyer
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

//Modal 

function SessionModal({ session, onClose }: { session: SessionDetail; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const statusMeta = STATUS_META[session.status];
  const kindMeta = KIND_META[session.kind];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center animate-in fade-in duration-200" onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 relative w-6/12 overflow-hidden rounded-3xl bg-surface shadow-2xl">
        {/* <div className={`h-1.5 w-full ${bandColor}`} /> */}
        <div className="max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-4">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-black leading-tight text-ink">{session.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                <Badge label={statusMeta.label} colorClass={statusMeta.color} dot={statusMeta.dot} />
                <Badge label={kindMeta.label} colorClass="bg-zinc-100 text-zinc-500 ring-zinc-200" icon={kindMeta.icon} />
                {session.isPublic && <Badge label="Public" colorClass="bg-powder/60 text-deep-green ring-powder" />}
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-xl p-2 text-muted-ink transition hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30" aria-label="Fermer">
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-6 px-7 pb-8">
            {session.description && <p className="text-sm leading-relaxed text-muted-ink">{session.description}</p>}

            {/* Date / Duree / Participants */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-canvas p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Calendar className="size-3" />Date</p>
                <p className="text-sm font-semibold text-ink">{new Date(session.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="mt-0.5 text-xs text-muted-ink">{new Date(session.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="rounded-xl bg-canvas p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Clock className="size-3" />Duree</p>
                <p className="text-sm font-semibold text-ink">{session.durationMinutes >= 60 ? `${Math.floor(session.durationMinutes / 60)}h${session.durationMinutes % 60 ? String(session.durationMinutes % 60).padStart(2, "0") : ""}` : `${session.durationMinutes} min`}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-xl bg-canvas p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Users className="size-3" />Participants</p>
                <p className="text-sm font-semibold text-ink">{session._count.participants} inscrit{session._count.participants !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Competence + Tuteur */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Sparkles className="size-3" />Competence</p>
                <div className="flex items-start gap-3 rounded-xl border border-hairline bg-canvas p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pistache/50 text-deep-green"><BookOpen className="size-4" /></div>
                  <div>
                    <p className="font-semibold text-ink">{session.skill.name}</p>
                    {session.skill.category && <p className="text-xs text-muted-ink">{session.skill.category.name}</p>}
                    {session.skill.canonicalDescription && <p className="mt-1.5 text-xs leading-relaxed text-muted-ink line-clamp-3">{session.skill.canonicalDescription}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><GraduationCap className="size-3" />Tuteur</p>
                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-4">
                  <Avatar profile={session.tutor} size="lg" />
                  <div>
                    <p className="font-semibold text-ink">{displayName(session.tutor)}</p>
                    {session.tutor.headline && <p className="mt-0.5 text-xs text-muted-ink">{session.tutor.headline}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            {session.participants.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Users className="size-3" />Participants ({session.participants.length})</p>
                <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
                  {session.participants.map((p) => {
                    const meta = PARTICIPATION_STATUS_META[p.status] ?? PARTICIPATION_STATUS_META["PENDING"];
                    return (
                      <li key={p.id} className="flex items-center justify-between bg-canvas px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar profile={p.student} size="sm" />
                          <span className="text-sm font-medium text-ink">{displayName(p.student)}</span>
                          {p.attended && <CheckCircle2 className="size-3.5 text-deep-green" />}
                        </div>
                        <Badge label={meta.label} colorClass={`${meta.color} ring-1`} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Feedback */}
            <FeedbackSection session={session} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: SessionDetail; onClick: () => void }) {
  const statusMeta = STATUS_META[session.status];
  const kindMeta = KIND_META[session.kind];
  return (
    <button onClick={onClick} className="group w-full text-left rounded-2xl border border-hairline bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-ink">{session.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-ink">{session.skill.name}{session.skill.category ? ` - ${session.skill.category.name}` : ""}</p>
        </div>
        <Badge label={statusMeta.label} colorClass={statusMeta.color} dot={statusMeta.dot} />
      </div>
      {session.description && <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-ink">{session.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-ink">
        <span className="flex items-center gap-1"><Calendar className="size-3 shrink-0" />{formatDate(session.scheduledAt)}</span>
        <span className="flex items-center gap-1"><Clock className="size-3 shrink-0" />{session.durationMinutes} min</span>
        <span className="flex items-center gap-1"><Users className="size-3 shrink-0" />{session._count.participants} participant{session._count.participants !== 1 ? "s" : ""}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-2">
          <Avatar profile={session.tutor} size="sm" />
          <span className="text-xs font-medium text-ink">{displayName(session.tutor)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge label={kindMeta.label} colorClass="bg-zinc-100 text-zinc-500 ring-zinc-200" icon={kindMeta.icon} />
          {session.isPublic && <Badge label="Public" colorClass="bg-powder/60 text-deep-green ring-powder" />}
        </div>
      </div>
    </button>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: SessionStatus | "ALL"; label: string }[] = [
  { value: "ALL",               label: "Tous"       },
  { value: "PROPOSED",          label: "Proposees"  },
  { value: "CONFIRMED",         label: "Confirmees" },
  { value: "IN_PROGRESS",       label: "En cours"   },
  { value: "AWAITING_FEEDBACK", label: "Feedback"   },
  { value: "COMPLETED",         label: "Terminees"  },
  { value: "CANCELLED",         label: "Annulees"   },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">("ALL");
  const [kindFilter, setKindFilter] = useState<SessionKind | "ALL">("ALL");
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) setSessions(data as SessionDetail[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openSession(session: SessionDetail) {
    setSelectedSession(session);
    try {
      const res = await fetch(`/api/sessions/${session.id}`);
      if (res.ok) setSelectedSession((await res.json()) as SessionDetail);
    } catch {}
  }

  const filtered = sessions.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.skill.name.toLowerCase().includes(search.toLowerCase()) || displayName(s.tutor).toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === "ALL" || s.status === statusFilter) && (kindFilter === "ALL" || s.kind === kindFilter);
  });

  const statusCounts = sessions.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <div className="border-b border-hairline bg-surface px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-1 font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Plateforme</p>
          <h1 className="font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">Sessions</h1>
          <p className="mt-2 text-sm text-muted-ink">{sessions.length} session{sessions.length !== 1 ? "s" : ""} au total</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
          </div>
          <div className="flex rounded-xl border border-hairline bg-surface p-1">
            {(["ALL", "TUTORING", "EVALUATION"] as const).map((k) => (
              <button key={k} onClick={() => setKindFilter(k)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${kindFilter === k ? "bg-ink text-surface shadow-sm" : "text-muted-ink hover:text-ink"}`}>
                {k === "ALL" ? "Tous" : k === "TUTORING" ? "Tutorat" : "Eval."}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
            const count = value === "ALL" ? sessions.length : (statusCounts[value] ?? 0);
            const active = statusFilter === value;
            const meta = value !== "ALL" ? STATUS_META[value] : null;
            return (
              <button key={value} onClick={() => setStatusFilter(value)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${active ? "bg-ink text-surface ring-ink" : "bg-surface text-muted-ink ring-hairline hover:ring-zinc-300 hover:text-ink"}`}>
                {meta && !active && <span className={`size-1.5 rounded-full ${meta.dot}`} />}
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/20" : "bg-zinc-100 text-zinc-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-ink">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">Chargement des sessions…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-surface py-16 text-center">
            <ChevronDown className="mb-3 size-8 text-zinc-300" />
            <p className="font-semibold text-zinc-400">Aucune session trouvee</p>
            <p className="mt-1 text-sm text-zinc-300">Essaie de modifier tes filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => <SessionCard key={s.id} session={s} onClick={() => openSession(s)} />)}
          </div>
        )}
      </div>

      {selectedSession && <SessionModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  );
}
