import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  GraduationCap,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { xpForLevel, getXpToNextLevel } from "@/lib/xp/levels";
import { computeBadges, type Badge } from "@/lib/badges";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, BookOpen, Users, Award, Sparkles, Star, TrendingUp, Zap, Trophy,
};

const TIER_LABEL: Record<string, string> = { HOLDER: "Holder", EXPERT: "Expert", MASTER: "Master" };

function XpTrack({ label, level, xp, icon: Icon }: { label: string; level: number; xp: number; icon: React.ComponentType<{ className?: string }> }) {
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const pct = ceil > floor ? Math.min(((xp - floor) / (ceil - floor)) * 100, 100) : 100;
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon className="size-4 text-muted-ink" />{label}</span>
        <span className="font-heading text-2xl font-black text-ink">{level}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hairline">
        <div className="h-full rounded-full bg-pistache transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-ink">{xp} XP · {getXpToNextLevel(xp)} pour le niveau {level + 1}</p>
    </div>
  );
}

export default async function ProgressionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      skills: {
        where: { status: "ACTIVE" },
        orderBy: [{ tier: "desc" }, { level: "desc" }],
        include: { skill: { select: { name: true, isCertified: true } } },
      },
      activity: { orderBy: { createdAt: "desc" }, take: 12 },
      _count: { select: { reviewsReceived: true } },
    },
  });
  if (!profile) redirect("/complete-profile");

  const fiveStarCount = await prisma.review.count({ where: { revieweeId: user.id, rating: 5 } });
  const expertSkills = profile.skills.filter((s) => s.tier === "EXPERT" || s.tier === "MASTER").length;

  const badges: Badge[] = computeBadges({
    sessionsTaught: profile.sessionsTaught,
    sessionsAttended: profile.sessionsAttended,
    sessionsCompleted: profile.sessionsCompleted,
    accountLevel: profile.accountLevel,
    tutorLevel: profile.tutorLevel,
    studentLevel: profile.studentLevel,
    expertSkills,
    fiveStarCount,
  });
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  const ACTIVITY_LABEL: Record<string, string> = {
    POST_CREATED: "Publication créée",
    COMMENT_CREATED: "Commentaire ajouté",
    MESSAGE_SENT: "Message envoyé",
    SESSION_TAUGHT: "Session animée",
    SESSION_ATTENDED: "Session suivie",
    SKILL_ATTRIBUTED: "Progression de compétence",
    FEEDBACK_GIVEN: "Feedback donné",
    PING_CREATED: "Demande de tutorat",
    LIKE_GIVEN: "Like donné",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Gamification</p>
        <h1 className="font-heading text-3xl font-black text-ink">Ma progression</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <XpTrack label="Compte" level={profile.accountLevel} xp={profile.accountXp} icon={Sparkles} />
        <XpTrack label="Tuteur" level={profile.tutorLevel} xp={profile.tutorXp} icon={GraduationCap} />
        <XpTrack label="Élève" level={profile.studentLevel} xp={profile.studentXp} icon={BookOpen} />
      </div>

      {/* Badges */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Badges ({earned.length}/{badges.length})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...earned, ...locked].map((b) => {
            const Icon = ICONS[b.icon] ?? Award;
            return (
              <div key={b.id} className={`rounded-2xl border p-4 text-center ${b.earned ? "border-pistache/40 bg-pistache/10" : "border-hairline bg-surface opacity-60"}`}>
                <div className={`mx-auto flex size-10 items-center justify-center rounded-xl ${b.earned ? "bg-pistache/40 text-deep-green" : "bg-canvas text-muted-ink"}`}>
                  {b.earned ? <Icon className="size-5" /> : <Lock className="size-4" />}
                </div>
                <p className="mt-2 text-xs font-semibold text-ink">{b.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-ink">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Skills */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Compétences</h2>
        {profile.skills.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">Aucune compétence.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.skills.map((us) => (
              <div key={us.id} className="flex items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                    {us.skill.name}
                    {us.skill.isCertified && <ShieldCheck className="size-3.5 shrink-0 text-deep-green" />}
                  </p>
                  <p className="text-xs text-muted-ink">Niveau {us.level} · {us.xp} XP</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${us.tier === "MASTER" ? "bg-pistache/40 text-deep-green" : us.tier === "EXPERT" ? "bg-powder/50 text-[#1a6b9c]" : "bg-canvas text-muted-ink"}`}>
                  {TIER_LABEL[us.tier]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Activité récente</h2>
        {profile.activity.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">Aucune activité.</p>
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
            {profile.activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-ink">{ACTIVITY_LABEL[a.type] ?? a.type}</span>
                <span className="flex items-center gap-2 text-xs text-muted-ink">
                  {a.xpAwarded > 0 && <span className="rounded-full bg-pistache/30 px-2 py-0.5 font-semibold text-deep-green">+{a.xpAwarded} XP</span>}
                  {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
