import Link from "next/link";
import {
  Award,
  BookOpen,
  GraduationCap,
  Link2,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { getXpToNextLevel } from "@/lib/xp/levels";
import { profileDisplayName, profileInitials } from "@/lib/profile/display";
import { ContactButton } from "@/components/profile/ContactButton";
import type { ProfileViewData } from "@/lib/profile/queries";

const TIER_LABEL: Record<string, string> = { HOLDER: "Holder", EXPERT: "Expert", MASTER: "Master" };

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`size-4 ${s <= Math.round(value) ? "fill-peach text-peach" : "fill-transparent text-zinc-300"}`} />
      ))}
    </span>
  );
}

function Stat({ label, value, node }: { label: string; value?: string | number; node?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-3 text-center">
      <div className="font-heading text-lg font-black text-ink">{node ?? value}</div>
      <p className="mt-0.5 text-[11px] text-muted-ink">{label}</p>
    </div>
  );
}

export function ProfileView({ profile, isSelf }: { profile: ProfileViewData; isSelf: boolean }) {
  const name = profileDisplayName(profile);
  const tutorRating = profile.tutorRatingAvg ? Number(profile.tutorRatingAvg) : null;
  const studentRating = profile.studentRatingAvg ? Number(profile.studentRatingAvg) : null;
  const reliability = profile.reliabilityScore ? Number(profile.reliabilityScore) : null;

  const tracks = [
    { label: "Compte", level: profile.accountLevel, xp: profile.accountXp, icon: Sparkles },
    { label: "Tuteur", level: profile.tutorLevel, xp: profile.tutorXp, icon: GraduationCap },
    { label: "Élève", level: profile.studentLevel, xp: profile.studentXp, icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-hairline bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-powder/50 text-2xl font-bold text-deep-green ring-1 ring-black/5">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={name} className="size-full object-cover" />
            ) : (
              profileInitials(profile)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-black text-ink">{name}</h1>
              {profile.rankTier && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <Award className="size-3" /> {profile.rankTier}
                </span>
              )}
            </div>
            {profile.username && <p className="text-sm text-muted-ink">@{profile.username}</p>}
            {profile.headline && <p className="mt-1 text-sm font-medium text-ink">{profile.headline}</p>}
            {profile.promotion && <p className="mt-1 text-xs text-muted-ink">{profile.promotion.name}</p>}
            {profile.bio && <p className="mt-3 text-sm leading-relaxed text-muted-ink">{profile.bio}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isSelf ? (
                <Link href="/settings" className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-surface transition hover:bg-ink/85">
                  <Settings className="size-4" /> Modifier mon profil
                </Link>
              ) : (
                <ContactButton targetUserId={profile.id} />
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-muted-ink transition hover:text-ink"><Link2 className="size-4" /> GitHub</a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-muted-ink transition hover:text-ink"><Link2 className="size-4" /> LinkedIn</a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sessions enseignées" value={profile.sessionsTaught} />
          <Stat label="Sessions suivies" value={profile.sessionsAttended} />
          <Stat label="Note tuteur" node={tutorRating !== null ? <Stars value={tutorRating} /> : <span className="text-muted-ink">—</span>} />
          <Stat label="Fiabilité" value={reliability !== null ? `${reliability.toFixed(0)}%` : "—"} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tracks.map(({ label, level, xp, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-hairline bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-ink"><Icon className="size-3.5" />{label}</span>
              <span className="font-heading text-lg font-black text-ink">Niv. {level}</span>
            </div>
            <p className="mt-1 text-xs text-muted-ink">{xp} XP · {getXpToNextLevel(xp)} pour le niveau suivant</p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Compétences</h2>
        {profile.skills.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">Aucune compétence déclarée.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.skills.map((us) => (
              <Link key={us.id} href={`/competences/${us.skill.slug}`} className="flex items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3 transition hover:border-powder">
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
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Avis reçus</h2>
        {profile.reviewsReceived.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">Aucun avis pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {profile.reviewsReceived.map((r) => (
              <div key={r.id} className="rounded-2xl border border-hairline bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-powder/50 text-xs font-semibold text-deep-green">
                      {r.reviewer.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.reviewer.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        profileInitials(r.reviewer)
                      )}
                    </div>
                    <span className="text-sm font-medium text-ink">{profileDisplayName(r.reviewer)}</span>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted-ink">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {studentRating !== null && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-ink">
          <MessageCircle className="size-3.5" /> Note moyenne en tant qu&apos;élève : {studentRating.toFixed(1)}/5
        </p>
      )}
    </div>
  );
}
