import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Calendar, Clock, GraduationCap, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { settleDueSessions } from "@/lib/sessions/mutations";
import { profileDisplayName } from "@/lib/profile/display";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "Terminée", cls: "bg-zinc-100 text-zinc-500" },
  CANCELLED: { label: "Annulée", cls: "bg-red-50 text-red-500" },
  AWAITING_FEEDBACK: { label: "Feedback attendu", cls: "bg-peach/20 text-orange-700" },
};

export default async function HistoriquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await settleDueSessions();

  const sessions = await prisma.tutoringSession.findMany({
    where: {
      status: { in: ["COMPLETED", "CANCELLED", "AWAITING_FEEDBACK"] },
      OR: [{ tutorId: user.id }, { participants: { some: { studentId: user.id } } }],
    },
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      scheduledAt: true,
      durationMinutes: true,
      tutorId: true,
      skill: { select: { name: true } },
      tutor: { select: { username: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-ink">Tutoring</p>
        <h1 className="flex items-center gap-2 font-heading text-3xl font-black text-ink">
          <History className="size-7 text-muted-ink" /> Historique
        </h1>
        <p className="mt-1 text-sm text-muted-ink">{sessions.length} session{sessions.length !== 1 ? "s" : ""} passée{sessions.length !== 1 ? "s" : ""}</p>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline bg-surface p-10 text-center text-sm text-muted-ink">
          Aucune session passée pour le moment.
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const meta = STATUS_META[s.status] ?? { label: s.status, cls: "bg-zinc-100 text-zinc-500" };
            const asTutor = s.tutorId === user.id;
            return (
              <li key={s.id}>
                <Link href={`/sessions?session=${s.id}`} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4 transition hover:border-powder">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-powder/40 text-deep-green">
                    {asTutor ? <GraduationCap className="size-5" /> : <BookOpen className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                    <p className="truncate text-xs text-muted-ink">
                      {s.skill.name} · {asTutor ? "en tant que tuteur" : `avec ${profileDisplayName(s.tutor)}`}
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-xs text-muted-ink">
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(s.scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{s.durationMinutes} min</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
