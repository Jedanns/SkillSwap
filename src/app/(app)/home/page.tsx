import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  GraduationCap,
  Rss,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMatchSuggestions } from "@/lib/matching";
import { getXpToNextLevel } from "@/lib/xp/levels";
import { profileDisplayName } from "@/lib/profile/display";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      isProfileComplete: true,
      firstName: true,
      displayName: true,
      accountLevel: true,
      accountXp: true,
      tutorLevel: true,
      tutorXp: true,
      studentLevel: true,
      studentXp: true,
    },
  });

  if (!profile?.isProfileComplete) redirect("/complete-profile");

  const now = new Date();
  const [upcoming, suggestions, popularSkills, recentPosts] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: {
        status: { in: ["PROPOSED", "CONFIRMED", "IN_PROGRESS"] },
        scheduledAt: { gte: new Date(now.getTime() - 6 * 3600_000) },
        OR: [{ tutorId: user.id }, { participants: { some: { studentId: user.id } } }],
      },
      orderBy: { scheduledAt: "asc" },
      take: 4,
      select: { id: true, title: true, scheduledAt: true, status: true, skill: { select: { name: true } } },
    }),
    getMatchSuggestions(user.id, 4),
    prisma.skill.findMany({
      where: { isDormant: false },
      orderBy: [{ isCertified: "desc" }, { heatScore: "desc" }, { sessionCount: "desc" }],
      take: 6,
      select: { id: true, name: true, slug: true, isCertified: true, _count: { select: { holders: true } } },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { username: true, firstName: true, lastName: true, displayName: true } },
      },
    }),
  ]);

  const name = profile.displayName || profile.firstName || "étudiant";
  const tracks = [
    { label: "Compte", level: profile.accountLevel, xp: profile.accountXp },
    { label: "Tuteur", level: profile.tutorLevel, xp: profile.tutorXp },
    { label: "Élève", level: profile.studentLevel, xp: profile.studentXp },
  ];

  return (
    <div className="mx-auto max-w-5xl px-2 py-2 sm:px-4">
      <header className="mb-6">
        <p className="text-sm text-muted-ink">Bienvenue sur SkillSwap</p>
        <h1 className="font-heading text-3xl font-black text-ink">Salut {name} 👋</h1>
      </header>

      {/* Quick links */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/competences" icon={Search} label="Trouver une compétence" />
        <QuickLink href="/sessions" icon={GraduationCap} label="Mes sessions" />
        <QuickLink href="/planning" icon={Calendar} label="Mon planning" />
        <QuickLink href="/feed" icon={Rss} label="Actualités" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Upcoming sessions */}
          <Card title="Sessions à venir" icon={Calendar} href="/sessions">
            {upcoming.length === 0 ? (
              <Empty>Aucune session planifiée. Proposez-en une ou pinguez une compétence.</Empty>
            ) : (
              <ul className="divide-y divide-hairline">
                {upcoming.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pistache/40 text-deep-green">
                      <GraduationCap className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                      <p className="text-xs text-muted-ink">{s.skill.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-ink">
                      {new Date(s.scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}{" "}
                      {new Date(s.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Suggestions */}
          <Card title="Suggestions de tutorat" icon={Users} href="/competences">
            {suggestions.length === 0 ? (
              <Empty>Pinguez une compétence depuis le catalogue pour recevoir des suggestions de tuteurs.</Empty>
            ) : (
              <ul className="divide-y divide-hairline">
                {suggestions.map((s) => (
                  <li key={`${s.skill.slug}-${s.tutor.id}`} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{profileDisplayName(s.tutor)}</p>
                      <p className="text-xs text-muted-ink">peut t&apos;enseigner {s.skill.name}</p>
                    </div>
                    {s.tutor.username && (
                      <Link href={`/u/${s.tutor.username}`} className="shrink-0 rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-powder/40">
                        Voir
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent feed */}
          <Card title="Dernières actualités" icon={Rss} href="/feed">
            {recentPosts.length === 0 ? (
              <Empty>Le fil est vide. Partagez une première actualité !</Empty>
            ) : (
              <ul className="divide-y divide-hairline">
                {recentPosts.map((p) => (
                  <li key={p.id} className="py-2.5">
                    <p className="text-xs font-semibold text-ink">{profileDisplayName(p.author)}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-ink">{p.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Progression */}
          <Card title="Ma progression" icon={TrendingUp} href="/progression">
            <div className="space-y-3">
              {tracks.map((t) => {
                const toNext = getXpToNextLevel(t.xp);
                return (
                  <div key={t.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-ink">{t.label}</span>
                      <span className="font-semibold text-ink">Niv. {t.level}</span>
                    </div>
                    <p className="text-[11px] text-muted-ink">{t.xp} XP · {toNext} pour le niveau suivant</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Popular skills */}
          <Card title="Compétences populaires" icon={Sparkles} href="/competences">
            <ul className="space-y-1.5">
              {popularSkills.map((s) => (
                <li key={s.id}>
                  <Link href={`/competences/${s.slug}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-canvas">
                    <BookOpen className="size-3.5 shrink-0 text-muted-ink" />
                    <span className="flex-1 truncate text-sm text-ink">{s.name}</span>
                    {s.isCertified && <ShieldCheck className="size-3.5 shrink-0 text-deep-green" />}
                    <span className="shrink-0 text-xs text-muted-ink">{s._count.holders}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-3.5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-powder/50 text-deep-green">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}

function Card({ title, icon: Icon, href, children }: { title: string; icon: React.ComponentType<{ className?: string }>; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <Icon className="size-4 text-muted-ink" />
          {title}
        </h2>
        <Link href={href} className="flex items-center gap-0.5 text-xs font-medium text-muted-ink transition hover:text-ink">
          Voir <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm text-muted-ink">{children}</p>;
}
