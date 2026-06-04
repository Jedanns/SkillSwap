"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Inbox,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  Star,
  Users,
  X,
  XCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  score: number | null;
  passed: boolean | null;
  reviewer: Profile;
  reviewee: Profile;
};

type Participant = {
  id: string;
  status: string;
  attended: boolean;
  student: Profile;
};

type Rubric = {
  id: string;
  scale: "OUT_OF_10" | "OUT_OF_20";
  passingScore: number;
  criteria: { id: string; label: string }[];
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
    canonicalDescription?: string | null;
    category: { name: string } | null;
  };
  participants: Participant[];
  reviews?: Review[];
  rubric?: Rubric | null;
  _count: { participants: number };
};

type TeachableSkill = { id: string; name: string; canTeach: boolean };
type Contact = { id: string; name: string };
type PingItem = {
  id: string;
  message: string | null;
  createdAt: string;
  skill: { id: string; name: string; slug: string };
  requester: Profile & { displayName: string | null };
};

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  PROPOSED: { label: "Proposée", color: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmée", color: "bg-powder/60 text-deep-green ring-powder", dot: "bg-deep-green" },
  IN_PROGRESS: { label: "En cours", color: "bg-pistache/40 text-deep-green ring-pistache", dot: "bg-pistache" },
  AWAITING_FEEDBACK: { label: "Feedback attendu", color: "bg-peach/20 text-orange-700 ring-peach/60", dot: "bg-peach" },
  COMPLETED: { label: "Terminée", color: "bg-zinc-100 text-zinc-500 ring-zinc-200", dot: "bg-zinc-400" },
  CANCELLED: { label: "Annulée", color: "bg-red-50 text-red-500 ring-red-200", dot: "bg-red-400" },
};

const KIND_META: Record<SessionKind, { label: string; icon: React.ReactNode }> = {
  TUTORING: { label: "Tutorat", icon: <BookOpen className="size-3" /> },
  EVALUATION: { label: "Évaluation", icon: <CheckCircle2 className="size-3" /> },
};

const PARTICIPATION_STATUS_META: Record<string, { label: string; color: string }> = {
  APPROVED: { label: "Accepté", color: "text-deep-green bg-pistache/40 ring-pistache" },
  PENDING: { label: "En attente", color: "text-amber-700 bg-amber-50 ring-amber-200" },
  INVITED: { label: "Invité", color: "text-sky-700 bg-sky-50 ring-sky-200" },
  DECLINED: { label: "Refusé", color: "text-red-500 bg-red-50 ring-red-200" },
  CANCELLED: { label: "Annulé", color: "text-zinc-400 bg-zinc-100 ring-zinc-200" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function displayName(p?: Profile | null) {
  if (!p) return "—";
  if (p.firstName || p.lastName) return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return p.username ?? "—";
}
function initials(p?: Profile | null) {
  return displayName(p).slice(0, 1).toUpperCase();
}
function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d.getTime() - now.getTime()) / 3_600_000;
  if (Math.abs(diffH) < 1) return "Maintenant";
  if (diffH > 0 && diffH < 24) return `Dans ${Math.round(diffH)}h`;
  if (diffH < 0 && diffH > -24) return `Il y a ${Math.round(-diffH)}h`;
  return (
    d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

const AVATAR_COLORS = ["bg-pistache text-deep-green", "bg-powder text-deep-green", "bg-peach/40 text-orange-800"];

function Avatar({ profile, size = "sm" }: { profile?: Profile | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "size-7", md: "size-9", lg: "size-12" }[size];
  const textClass = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  if (!profile) {
    return <div className={`${sizeClass} ${textClass} flex shrink-0 items-center justify-center rounded-full bg-canvas font-semibold text-muted-ink ring-1 ring-black/10`}>?</div>;
  }
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

function Badge({ label, colorClass, dot, icon }: { label: string; colorClass: string; dot?: string; icon?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${colorClass}`}>
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {icon}
      {label}
    </span>
  );
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (readonly ? value : hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star className={`size-5 transition-colors ${filled ? "fill-peach text-peach" : "fill-transparent text-zinc-300"}`} />
          </button>
        );
      })}
    </div>
  );
}

function actionBtn(variant: "primary" | "ghost" | "danger") {
  const base = "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  if (variant === "primary") return `${base} bg-ink text-surface hover:bg-ink/85`;
  if (variant === "danger") return `${base} bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100`;
  return `${base} bg-canvas text-ink ring-1 ring-hairline hover:bg-powder/40`;
}

// ─── One feedback card (rate a single counterpart) ───────────────────────────

function ReviewForm({
  session,
  revieweeId,
  revieweeName,
  direction,
  onSubmit,
}: {
  session: SessionDetail;
  revieweeId: string;
  revieweeName: string;
  direction: "STUDENT_TO_TUTOR" | "TUTOR_TO_STUDENT";
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const isEvaluation = session.kind === "EVALUATION" && direction === "TUTOR_TO_STUDENT";
  const rubric = session.rubric ?? null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxScore = rubric?.scale === "OUT_OF_10" ? 10 : 20;
  const numericScore = score === "" ? null : Number(score);
  const passed = isEvaluation && rubric && numericScore !== null ? numericScore >= rubric.passingScore : undefined;

  async function handle() {
    if (rating < 1) return;
    setBusy(true);
    setError(null);
    try {
      const notions = rubric
        ? rubric.criteria.map((c) => ({ rubricCriterionId: c.id, label: c.label, acquired: !!checks[c.id] }))
        : undefined;
      await onSubmit({
        sessionId: session.id,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
        direction,
        ...(isEvaluation ? { score: numericScore ?? undefined, passed, rubricId: rubric?.id } : {}),
        ...(notions ? { notions } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-peach/40 bg-peach/5 p-4">
      <p className="mb-3 text-sm font-semibold text-ink">
        {direction === "STUDENT_TO_TUTOR" ? "Noter le tuteur" : `Évaluer ${revieweeName}`}
      </p>

      <div className="mb-3">
        <p className="mb-1.5 text-xs text-muted-ink">Note globale</p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {isEvaluation && rubric && (
        <div className="mb-3 space-y-3 rounded-lg border border-hairline bg-surface p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">Évaluation sur {maxScore}</p>
            <input
              type="number"
              min={0}
              max={maxScore}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={`/${maxScore}`}
              className="w-20 rounded-lg border border-hairline bg-canvas px-2 py-1 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>
          <p className="text-[11px] text-muted-ink">Seuil de réussite : {rubric.passingScore}/{maxScore}</p>
          {rubric.criteria.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-ink">Notions</p>
              {rubric.criteria.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={!!checks[c.id]}
                    onChange={(e) => setChecks((p) => ({ ...p, [c.id]: e.target.checked }))}
                    className="size-4 rounded border-hairline text-ink focus:ring-ink/30"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
          {passed !== undefined && numericScore !== null && (
            <p className={`text-xs font-semibold ${passed ? "text-deep-green" : "text-red-500"}`}>
              {passed ? "✓ Compétence acquise — l'élève pourra l'enseigner" : "✗ Compétence non acquise"}
            </p>
          )}
        </div>
      )}

      <div className="mb-3">
        <p className="mb-1.5 text-xs text-muted-ink">Commentaire (optionnel)</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Décris ton expérience de la session..."
          className="w-full resize-none rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
      </div>

      {error && <p className="mb-2 text-xs font-medium text-red-500">{error}</p>}

      <button onClick={handle} disabled={rating < 1 || busy} className={actionBtn("primary")}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Envoyer
      </button>
    </div>
  );
}

// ─── Feedback section (lists existing reviews + the right forms) ─────────────

function FeedbackSection({
  session,
  currentUserId,
  onSubmit,
}: {
  session: SessionDetail;
  currentUserId: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  if (session.status !== "AWAITING_FEEDBACK" && session.status !== "COMPLETED") return null;

  const reviews = session.reviews ?? [];
  const isTutor = session.tutor.id === currentUserId;
  const myAttendance = session.participants.find((p) => p.student?.id === currentUserId);
  const canGiveFeedback = session.status === "AWAITING_FEEDBACK";

  // Who do I still need to review?
  const pending: { revieweeId: string; revieweeName: string; direction: "STUDENT_TO_TUTOR" | "TUTOR_TO_STUDENT" }[] = [];
  if (canGiveFeedback) {
    if (isTutor) {
      for (const p of session.participants.filter((x) => x.attended && x.student)) {
        const done = reviews.some((r) => r.reviewer.id === currentUserId && r.reviewee.id === p.student.id);
        if (!done) pending.push({ revieweeId: p.student.id, revieweeName: displayName(p.student), direction: "TUTOR_TO_STUDENT" });
      }
    } else if (myAttendance?.attended) {
      const done = reviews.some((r) => r.reviewer.id === currentUserId && r.reviewee.id === session.tutor.id);
      if (!done) pending.push({ revieweeId: session.tutor.id, revieweeName: displayName(session.tutor), direction: "STUDENT_TO_TUTOR" });
    }
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
        <MessageSquare className="size-3" />
        Feedback
      </p>

      {reviews.length > 0 && (
        <div className="mb-4 space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-hairline bg-canvas p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar profile={review.reviewer} size="sm" />
                  <div>
                    <p className="text-xs font-semibold text-ink">{displayName(review.reviewer)}</p>
                    <p className="text-[10px] text-muted-ink">
                      {review.direction === "STUDENT_TO_TUTOR" ? "vers le tuteur" : `vers ${displayName(review.reviewee)}`}
                    </p>
                  </div>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.score !== null && (
                <p className={`mt-2 text-xs font-semibold ${review.passed ? "text-deep-green" : "text-red-500"}`}>
                  Score : {review.score} — {review.passed ? "Acquis" : "Non acquis"}
                </p>
              )}
              {review.comment && <p className="mt-2 text-sm leading-relaxed text-muted-ink">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 ? (
        <div className="space-y-3">
          {pending.map((p) => (
            <ReviewForm
              key={p.revieweeId}
              session={session}
              revieweeId={p.revieweeId}
              revieweeName={p.revieweeName}
              direction={p.direction}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      ) : (
        canGiveFeedback && (
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas p-4 text-sm font-medium text-deep-green">
            <CheckCircle2 className="size-4 text-pistache" />
            Merci, ton feedback a été enregistré !
          </div>
        )
      )}
    </div>
  );
}

// ─── Action bar (role-aware lifecycle buttons) ───────────────────────────────

function ActionBar({
  session,
  currentUserId,
  onAction,
  onRespond,
  busy,
}: {
  session: SessionDetail;
  currentUserId: string;
  onAction: (action: "cancel" | "start" | "end") => void;
  onRespond: (accept: boolean) => void;
  busy: boolean;
}) {
  const isTutor = session.tutor.id === currentUserId;
  const myPart = session.participants.find((p) => p.student?.id === currentUserId);
  const involved = isTutor || !!myPart;
  if (!involved) return null;

  const canRespond = !!myPart && (myPart.status === "PENDING" || myPart.status === "INVITED");
  const buttons: React.ReactNode[] = [];

  if (session.status === "PROPOSED" && canRespond) {
    buttons.push(
      <button key="accept" onClick={() => onRespond(true)} disabled={busy} className={actionBtn("primary")}>
        <CheckCircle2 className="size-4" /> Accepter
      </button>,
      <button key="decline" onClick={() => onRespond(false)} disabled={busy} className={actionBtn("ghost")}>
        <XCircle className="size-4" /> Refuser
      </button>,
    );
  }
  if (session.status === "CONFIRMED") {
    buttons.push(
      <button key="start" onClick={() => onAction("start")} disabled={busy} className={actionBtn("primary")}>
        <Play className="size-4" /> Démarrer
      </button>,
    );
  }
  if (session.status === "IN_PROGRESS") {
    buttons.push(
      <button key="end" onClick={() => onAction("end")} disabled={busy} className={actionBtn("primary")}>
        <Square className="size-4" /> Terminer
      </button>,
    );
  }
  if (session.status === "PROPOSED" || session.status === "CONFIRMED") {
    buttons.push(
      <button key="cancel" onClick={() => onAction("cancel")} disabled={busy} className={actionBtn("danger")}>
        <X className="size-4" /> Annuler
      </button>,
    );
  }

  if (buttons.length === 0) return null;
  return <div className="flex flex-wrap gap-2">{buttons}</div>;
}

// ─── Session modal ───────────────────────────────────────────────────────────

function SessionModal({
  session,
  currentUserId,
  onClose,
  onAction,
  onRespond,
  onReview,
  busy,
}: {
  session: SessionDetail;
  currentUserId: string;
  onClose: () => void;
  onAction: (action: "cancel" | "start" | "end") => void;
  onRespond: (accept: boolean) => void;
  onReview: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const statusMeta = STATUS_META[session.status];
  const kindMeta = KIND_META[session.kind];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-4">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-black leading-tight text-ink">{session.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                <Badge label={statusMeta.label} colorClass={statusMeta.color} dot={statusMeta.dot} />
                <Badge label={kindMeta.label} colorClass="bg-zinc-100 text-zinc-500 ring-zinc-200" icon={kindMeta.icon} />
                {session.isPublic && <Badge label="Public" colorClass="bg-powder/60 text-deep-green ring-powder" />}
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-xl p-2 text-muted-ink transition hover:bg-canvas hover:text-ink" aria-label="Fermer">
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-6 px-7 pb-8">
            <ActionBar session={session} currentUserId={currentUserId} onAction={onAction} onRespond={onRespond} busy={busy} />

            {session.description && <p className="text-sm leading-relaxed text-muted-ink">{session.description}</p>}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-canvas p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <Calendar className="size-3" />
                  Date
                </p>
                <p className="text-sm font-semibold text-ink">
                  {new Date(session.scheduledAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="mt-0.5 text-xs text-muted-ink">
                  {new Date(session.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="rounded-xl bg-canvas p-3.5">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <Clock className="size-3" />
                  Durée
                </p>
                <p className="text-sm font-semibold text-ink">
                  {session.durationMinutes >= 60
                    ? `${Math.floor(session.durationMinutes / 60)}h${session.durationMinutes % 60 ? String(session.durationMinutes % 60).padStart(2, "0") : ""}`
                    : `${session.durationMinutes} min`}
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-canvas p-3.5 sm:col-span-1">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <Users className="size-3" />
                  Participants
                </p>
                <p className="text-sm font-semibold text-ink">
                  {session._count.participants} inscrit{session._count.participants !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <Sparkles className="size-3" />
                  Compétence
                </p>
                <div className="flex items-start gap-3 rounded-xl border border-hairline bg-canvas p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pistache/50 text-deep-green">
                    <BookOpen className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{session.skill.name}</p>
                    {session.skill.category && <p className="text-xs text-muted-ink">{session.skill.category.name}</p>}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <GraduationCap className="size-3" />
                  Tuteur
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-4">
                  <Avatar profile={session.tutor} size="lg" />
                  <div>
                    <p className="font-semibold text-ink">{displayName(session.tutor)}</p>
                    {session.tutor.headline && <p className="mt-0.5 text-xs text-muted-ink">{session.tutor.headline}</p>}
                  </div>
                </div>
              </div>
            </div>

            {session.participants.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink">
                  <Users className="size-3" />
                  Participants ({session.participants.length})
                </p>
                <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
                  {session.participants.filter((p) => p.student).map((p) => {
                    const meta = PARTICIPATION_STATUS_META[p.status] ?? PARTICIPATION_STATUS_META.PENDING;
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

            <FeedbackSection session={session} currentUserId={currentUserId} onSubmit={onReview} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session card ────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: SessionDetail; onClick: () => void }) {
  const statusMeta = STATUS_META[session.status];
  const kindMeta = KIND_META[session.kind];
  return (
    <button onClick={onClick} className="group w-full rounded-2xl border border-hairline bg-surface p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-ink">{session.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-ink">
            {session.skill.name}
            {session.skill.category ? ` · ${session.skill.category.name}` : ""}
          </p>
        </div>
        <Badge label={statusMeta.label} colorClass={statusMeta.color} dot={statusMeta.dot} />
      </div>
      {session.description && <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-ink">{session.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-ink">
        <span className="flex items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          {formatDate(session.scheduledAt)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3 shrink-0" />
          {session.durationMinutes} min
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3 shrink-0" />
          {session._count.participants}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <div className="flex items-center gap-2">
          <Avatar profile={session.tutor} size="sm" />
          <span className="text-xs font-medium text-ink">{displayName(session.tutor)}</span>
        </div>
        <Badge label={kindMeta.label} colorClass="bg-zinc-100 text-zinc-500 ring-zinc-200" icon={kindMeta.icon} />
      </div>
    </button>
  );
}

// ─── Propose-session modal ───────────────────────────────────────────────────

function ProposeModal({
  currentUserId,
  prefill,
  onClose,
  onCreated,
}: {
  currentUserId: string;
  prefill?: { skillId?: string; studentId?: string };
  onClose: () => void;
  onCreated: () => void;
}) {
  const [skills, setSkills] = useState<TeachableSkill[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [skillId, setSkillId] = useState(prefill?.skillId ?? "");
  const [studentId, setStudentId] = useState(prefill?.studentId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/skills")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { skill: { id: string; name: string }; canTeach: boolean }[]) => {
        if (Array.isArray(data)) {
          setSkills(data.filter((s) => s.canTeach).map((s) => ({ id: s.skill.id, name: s.skill.name, canTeach: s.canTeach })));
        }
      })
      .catch(() => {});
    fetch("/api/conversations")
      .then((r) => (r.ok ? r.json() : { conversations: [] }))
      .then((data: { conversations: { otherParticipant: { id: string; displayName: string | null; firstName: string | null; lastName: string | null; username: string | null } }[] }) => {
        const list = (data.conversations ?? [])
          .map((c) => c.otherParticipant)
          .filter((p) => p.id && p.id !== currentUserId)
          .map((p) => ({ id: p.id, name: p.displayName || [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username || "Étudiant" }));
        setContacts(list);
      })
      .catch(() => {});
  }, [currentUserId]);

  async function submit() {
    if (!skillId || !studentId || !title.trim() || !date) {
      setError("Compétence, élève, titre et date sont requis.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId,
          studentIds: [studentId],
          title: title.trim(),
          description: description.trim() || undefined,
          scheduledAt: new Date(date).toISOString(),
          durationMinutes: Number(duration),
          kind: "TUTORING",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec de la proposition.");
      }
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl bg-surface p-7 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-black text-ink">Proposer une session</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-ink hover:bg-canvas hover:text-ink" aria-label="Fermer">
            <X className="size-5" />
          </button>
        </div>

        {skills.length === 0 ? (
          <p className="rounded-xl bg-canvas p-4 text-sm text-muted-ink">
            Vous devez d&apos;abord posséder une compétence enseignable pour proposer une session.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-ink">Compétence</span>
              <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20">
                <option value="">Choisir…</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-ink">Élève</span>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20">
                <option value="">Choisir parmi vos contacts…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {contacts.length === 0 && <span className="mt-1 block text-[11px] text-muted-ink">Ouvrez d&apos;abord une conversation avec l&apos;élève.</span>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-ink">Titre</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Les hooks React" className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-ink">Description (optionnel)</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-ink">Date & heure</span>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-ink">Durée (min)</span>
                <input type="number" min={15} max={480} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
              </label>
            </div>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <button onClick={submit} disabled={busy} className={`${actionBtn("primary")} w-full justify-center`}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Envoyer la proposition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pings inbox ─────────────────────────────────────────────────────────────

function PingsInbox({ onPropose }: { onPropose: (prefill: { skillId: string; studentId: string }) => void }) {
  const router = useRouter();
  const [pings, setPings] = useState<PingItem[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    fetch("/api/pings")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setPings(data))
      .catch(() => {});
  }, []);

  async function openChat(userId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages/${data.conversation.id}`);
    }
  }

  if (pings.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-peach/40 bg-peach/5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-5 py-3 text-left">
        <Inbox className="size-4 text-orange-700" />
        <span className="flex-1 text-sm font-semibold text-ink">Demandes de tutorat ({pings.length})</span>
        <ChevronDown className={`size-4 text-muted-ink transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="divide-y divide-peach/30">
          {pings.map((ping) => (
            <li key={ping.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Avatar profile={ping.requester} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {ping.requester.displayName || displayName(ping.requester)} cherche un tuteur en <span className="font-semibold">{ping.skill.name}</span>
                </p>
                {ping.message && <p className="truncate text-xs text-muted-ink">« {ping.message} »</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openChat(ping.requester.id)} className={actionBtn("ghost")}>
                  <MessageSquare className="size-3.5" /> Chat
                </button>
                <button onClick={() => onPropose({ skillId: ping.skill.id, studentId: ping.requester.id })} className={actionBtn("primary")}>
                  <Plus className="size-3.5" /> Proposer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: SessionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "PROPOSED", label: "Proposées" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "AWAITING_FEEDBACK", label: "Feedback" },
  { value: "COMPLETED", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
];

export function SessionsView({
  currentUserId,
  initialSessionId,
  initialProposeStudentId,
  initialProposeSkillId,
}: {
  currentUserId: string;
  initialSessionId?: string | null;
  initialProposeStudentId?: string | null;
  initialProposeSkillId?: string | null;
}) {
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">("ALL");
  const [kindFilter, setKindFilter] = useState<SessionKind | "ALL">("ALL");
  const [selected, setSelected] = useState<SessionDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposePrefill, setProposePrefill] = useState<{ skillId?: string; studentId?: string } | undefined>();

  const loadList = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data as SessionDetail[]);
    }
  }, []);

  useEffect(() => {
    loadList().finally(() => setLoading(false));
  }, [loadList]);

  // Deep-link: auto-open a specific session (from /historique, /feedback, notifications).
  useEffect(() => {
    if (!initialSessionId) return;
    fetch(`/api/sessions/${initialSessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSelected(data as SessionDetail))
      .catch(() => {});
  }, [initialSessionId]);

  // Deep-link: open the propose modal prefilled (from a chat's "Proposer une session").
  useEffect(() => {
    if (initialProposeStudentId) {
      setProposePrefill({ studentId: initialProposeStudentId, skillId: initialProposeSkillId ?? undefined });
      setProposing(true);
    }
  }, [initialProposeStudentId, initialProposeSkillId]);

  async function openSession(session: SessionDetail) {
    setSelected(session);
    const res = await fetch(`/api/sessions/${session.id}`);
    if (res.ok) setSelected((await res.json()) as SessionDetail);
  }

  async function refreshSelected(id: string) {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) setSelected((await res.json()) as SessionDetail);
  }

  async function handleAction(action: "cancel" | "start" | "end") {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSelected(data.session as SessionDetail);
      }
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function handleRespond(accept: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${selected.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", accept }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSelected(data.session as SessionDetail);
      }
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function handleReview(payload: Record<string, unknown>) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Échec de l'envoi du feedback.");
    }
    if (selected) await refreshSelected(selected.id);
    await loadList();
  }

  const filtered = sessions.filter((s) => {
    const matchSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.skill.name.toLowerCase().includes(search.toLowerCase()) ||
      displayName(s.tutor).toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === "ALL" || s.status === statusFilter) && (kindFilter === "ALL" || s.kind === kindFilter);
  });

  const statusCounts = sessions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <div className="border-b border-hairline bg-surface px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-end justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Tutoring</p>
            <h1 className="font-heading text-3xl font-black tracking-tight text-ink sm:text-4xl">Sessions</h1>
            <p className="mt-2 text-sm text-muted-ink">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={() => { setProposePrefill(undefined); setProposing(true); }} className={actionBtn("primary")}>
            <Plus className="size-4" /> Proposer
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <PingsInbox onPropose={(prefill) => { setProposePrefill(prefill); setProposing(true); }} />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
            <input type="text" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-ink/20" />
          </div>
          <div className="flex rounded-xl border border-hairline bg-surface p-1">
            {(["ALL", "TUTORING", "EVALUATION"] as const).map((k) => (
              <button key={k} onClick={() => setKindFilter(k)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${kindFilter === k ? "bg-ink text-surface shadow-sm" : "text-muted-ink hover:text-ink"}`}>
                {k === "ALL" ? "Tous" : k === "TUTORING" ? "Tutorat" : "Éval."}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
            const count = value === "ALL" ? sessions.length : statusCounts[value] ?? 0;
            const active = statusFilter === value;
            const meta = value !== "ALL" ? STATUS_META[value] : null;
            return (
              <button key={value} onClick={() => setStatusFilter(value)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${active ? "bg-ink text-surface ring-ink" : "bg-surface text-muted-ink ring-hairline hover:text-ink hover:ring-zinc-300"}`}>
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
            <span className="text-sm">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-surface py-16 text-center">
            <GraduationCap className="mb-3 size-8 text-zinc-300" />
            <p className="font-semibold text-zinc-400">Aucune session</p>
            <p className="mt-1 text-sm text-zinc-300">Proposez-en une ou attendez une demande</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <SessionCard key={s.id} session={s} onClick={() => openSession(s)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <SessionModal
          session={selected}
          currentUserId={currentUserId}
          onClose={() => setSelected(null)}
          onAction={handleAction}
          onRespond={handleRespond}
          onReview={handleReview}
          busy={busy}
        />
      )}

      {proposing && (
        <ProposeModal
          currentUserId={currentUserId}
          prefill={proposePrefill}
          onClose={() => setProposing(false)}
          onCreated={() => {
            setProposing(false);
            loadList();
          }}
        />
      )}
    </div>
  );
}
