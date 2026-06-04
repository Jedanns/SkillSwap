import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { profileDisplayName, profileInitials } from "@/lib/profile/display";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const me = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { promotionId: true, promotion: { select: { name: true } } },
  });

  const profiles = await prisma.profile.findMany({
    where: { isProfileComplete: true, ...(me?.promotionId ? { promotionId: me.promotionId } : {}) },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      accountLevel: true,
      tutorLevel: true,
      studentLevel: true,
      sessionsTaught: true,
      rankTier: true,
    },
  });

  const ranked = profiles
    .map((p) => ({ ...p, combined: p.accountLevel + p.tutorLevel + p.studentLevel }))
    .sort((a, b) => b.combined - a.combined || b.sessionsTaught - a.sessionsTaught)
    .slice(0, 50);

  const medal = ["text-amber-500", "text-zinc-400", "text-orange-700"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Classement</p>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-black text-ink">
          <Trophy className="size-7 text-amber-500" /> Leaderboard
        </h1>
        {me?.promotion && <p className="mt-1 text-sm text-muted-ink">Promotion {me.promotion.name}</p>}
      </header>

      <ol className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
        {ranked.map((p, i) => {
          const isMe = p.id === user.id;
          const inner = (
            <>
              <span className={`w-7 shrink-0 text-center font-heading text-lg font-black ${i < 3 ? medal[i] : "text-muted-ink"}`}>
                {i + 1}
              </span>
              <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-powder/50 text-xs font-semibold text-deep-green">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  profileInitials(p)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{profileDisplayName(p)}{isMe ? " (vous)" : ""}</p>
                <p className="text-xs text-muted-ink">{p.sessionsTaught} session{p.sessionsTaught !== 1 ? "s" : ""} animée{p.sessionsTaught !== 1 ? "s" : ""}</p>
              </div>
              {p.rankTier && (
                <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 sm:inline-flex">
                  <Award className="size-3" /> {p.rankTier}
                </span>
              )}
              <span className="shrink-0 font-heading text-base font-black text-ink">Niv. {p.combined}</span>
            </>
          );
          return (
            <li key={p.id} className={isMe ? "bg-pistache/10" : ""}>
              {p.username ? (
                <Link href={`/u/${p.username}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-canvas">{inner}</Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
