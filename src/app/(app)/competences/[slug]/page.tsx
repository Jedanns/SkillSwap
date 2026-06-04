import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { profileDisplayName, profileInitials } from "@/lib/profile/display";
import { SkillPageActions } from "@/components/skills/SkillPageActions";
import { ContactButton } from "@/components/profile/ContactButton";

const TIER_LABEL: Record<string, string> = { HOLDER: "Holder", EXPERT: "Expert", MASTER: "Master" };
const profileSel = { id: true, username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } as const;

export default async function SkillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const skill = await prisma.skill.findUnique({
    where: { slug },
    include: {
      category: true,
      notions: { orderBy: { position: "asc" } },
      certifiedBy: { select: profileSel },
      featuredUserSkill: { include: { profile: { select: profileSel } } },
      holders: {
        where: { status: "ACTIVE" },
        orderBy: [{ tier: "desc" }, { level: "desc" }],
        take: 30,
        include: { profile: { select: { ...profileSel, tutorRatingAvg: true } } },
      },
      _count: { select: { holders: true, sessions: true } },
    },
  });
  if (!skill) notFound();

  const mine = await prisma.userSkill.findUnique({
    where: { profileId_skillId: { profileId: user.id, skillId: skill.id } },
    select: { id: true, tier: true, level: true, customTitle: true, customDescription: true, customImageUrl: true },
  });

  const featured = skill.featuredUserSkill;
  // The displayed "version" is the highest-level holder's custom presentation,
  // falling back to the canonical skill content.
  const heroTitle = featured?.customTitle || skill.name;
  const heroDescription = featured?.customDescription || skill.canonicalDescription || null;
  const heroImage = featured?.customImageUrl || null;
  const featuredAuthor = featured?.profile ?? null;

  const topExpert = skill.holders.find((h) => (h.tier === "EXPERT" || h.tier === "MASTER") && h.canTeach && h.profile.id !== user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link href="/competences" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-ink transition hover:text-ink">
        <ArrowLeft className="size-4" /> Catalogue
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt={heroTitle} className="h-48 w-full object-cover" />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-ink">{skill.category?.name ?? "Sans catégorie"}</p>
            {skill.isCertified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pistache/30 px-2 py-0.5 text-xs font-semibold text-deep-green">
                <ShieldCheck className="size-3" /> Certifiée
              </span>
            )}
          </div>
          <h1 className="mt-1 font-heading text-3xl font-black text-ink">{heroTitle}</h1>

          {featuredAuthor && (
            <p className="mt-2 text-xs text-muted-ink">
              Version présentée par{" "}
              {featuredAuthor.username ? (
                <Link href={`/u/${featuredAuthor.username}`} className="font-medium text-ink underline-offset-2 hover:underline">{profileDisplayName(featuredAuthor)}</Link>
              ) : (
                <span className="font-medium text-ink">{profileDisplayName(featuredAuthor)}</span>
              )}
              {" "}— le plus haut niveau sur cette compétence.
            </p>
          )}
          {skill.isCertified && skill.certifiedBy && (
            <p className="mt-1 text-xs text-muted-ink">Certifiée par {profileDisplayName(skill.certifiedBy)}.</p>
          )}

          <div className="mt-4 flex gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-ink"><Users className="size-4" />{skill._count.holders} détenteur{skill._count.holders !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1.5 text-muted-ink"><GraduationCap className="size-4" />{skill._count.sessions} session{skill._count.sessions !== 1 ? "s" : ""}</span>
          </div>

          {heroDescription && (
            <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-ink">{heroDescription}</div>
          )}
        </div>
      </div>

      {/* Notions */}
      {skill.notions.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-ink"><BookOpen className="size-5 text-muted-ink" /> Notions abordées</h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {skill.notions.map((n) => (
              <li key={n.id} className="flex items-start gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-muted-ink" />
                <span>
                  {n.title}
                  {n.description && <span className="block text-xs text-muted-ink">{n.description}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions (ping / add / evaluation / customize) */}
      <section className="mt-6">
        <SkillPageActions
          skillId={skill.id}
          slug={skill.slug}
          skillName={skill.name}
          isCertified={skill.isCertified}
          mine={mine}
          topExpertId={topExpert?.profile.id ?? null}
          autoEdit={edit === "1"}
        />
      </section>

      {/* Holders */}
      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-ink"><Users className="size-5 text-muted-ink" /> Détenteurs</h2>
        {skill.holders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">Personne ne détient encore cette compétence.</p>
        ) : (
          <ul className="space-y-2">
            {skill.holders.map((h) => (
              <li key={h.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3">
                <Link href={h.profile.username ? `/u/${h.profile.username}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-powder/50 text-xs font-semibold text-deep-green">
                    {h.profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.profile.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      profileInitials(h.profile)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{profileDisplayName(h.profile)}</p>
                    <p className="text-xs text-muted-ink">Niveau {h.level}{h.canTeach ? " · tuteur" : ""}</p>
                  </div>
                </Link>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${h.tier === "MASTER" ? "bg-pistache/40 text-deep-green" : h.tier === "EXPERT" ? "bg-powder/50 text-[#1a6b9c]" : "bg-canvas text-muted-ink"}`}>
                  {TIER_LABEL[h.tier]}
                </span>
                {h.profile.id !== user.id && <ContactButton targetUserId={h.profile.id} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
