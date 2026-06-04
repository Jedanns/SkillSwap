import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { settleDueSessions } from "@/lib/sessions/mutations";
import { profileDisplayName, profileInitials } from "@/lib/profile/display";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`size-4 ${s <= value ? "fill-peach text-peach" : "fill-transparent text-zinc-300"}`} />
      ))}
    </span>
  );
}

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await settleDueSessions();

  const [pendingSessions, received] = await Promise.all([
    prisma.tutoringSession.findMany({
      where: {
        status: "AWAITING_FEEDBACK",
        OR: [{ tutorId: user.id }, { participants: { some: { studentId: user.id, attended: true } } }],
      },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        title: true,
        tutorId: true,
        skill: { select: { name: true } },
        reviews: { select: { reviewerId: true } },
      },
    }),
    prisma.review.findMany({
      where: { revieweeId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        reviewer: { select: { username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        session: { select: { title: true } },
      },
    }),
  ]);

  // Only sessions where the current user still owes a review.
  const toReview = pendingSessions.filter((s) => !s.reviews.some((r) => r.reviewerId === user.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Réputation</p>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-black text-ink">
          <MessageSquare className="size-7 text-muted-ink" /> Feedback
        </h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">À évaluer ({toReview.length})</h2>
        {toReview.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">
            Aucun feedback en attente. 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {toReview.map((s) => (
              <li key={s.id}>
                <Link href={`/sessions?session=${s.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-peach/40 bg-peach/5 p-4 transition hover:border-peach">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                    <p className="text-xs text-muted-ink">{s.skill.name} · {s.tutorId === user.id ? "évaluez vos élèves" : "notez votre tuteur"}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-ink px-3 py-1.5 text-xs font-medium text-surface">Donner mon avis</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">Avis reçus</h2>
        {received.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-surface p-6 text-center text-sm text-muted-ink">
            Vous n&apos;avez pas encore reçu d&apos;avis.
          </p>
        ) : (
          <div className="space-y-3">
            {received.map((r) => (
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
                    <div>
                      <p className="text-sm font-medium text-ink">{profileDisplayName(r.reviewer)}</p>
                      <p className="text-[11px] text-muted-ink">{r.session.title}</p>
                    </div>
                  </div>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted-ink">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
