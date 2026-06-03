import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { WeekCalendar } from "@/components/planning/WeekCalendar";
import type { PlanningSession } from "@/components/planning/WeekCalendar";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { week } = await searchParams;

  const weekStart = week
    ? (() => { const d = new Date(week + "T00:00:00"); return isNaN(d.getTime()) ? getMondayOfWeek(new Date()) : d; })()
    : getMondayOfWeek(new Date());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const rawSessions = user
    ? await prisma.tutoringSession.findMany({
        where: {
          scheduledAt: { gte: weekStart, lt: weekEnd },
          OR: [
            { tutorId: user.id },
            {
              participants: {
                some: {
                  studentId: user.id,
                  status: { in: ["APPROVED", "PENDING", "INVITED"] },
                },
              },
            },
          ],
        },
        include: {
          skill: { select: { name: true } },
          tutor: { select: { displayName: true } },
        },
        orderBy: { scheduledAt: "asc" },
      })
    : [];

  const sessions: PlanningSession[] = rawSessions.map((s) => ({
    id: s.id,
    title: s.title,
    scheduledAt: s.scheduledAt.toISOString(),
    duration_minutes: s.durationMinutes,
    status: s.status,
    kind: s.kind,
    skillName: s.skill?.name ?? null,
    tutorName: s.tutor?.displayName ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-[1200px] pb-12 px-3 sm:px-4 pt-2">
      <h1 className="font-heading text-2xl font-bold mb-6">Planning</h1>
      <WeekCalendar sessions={sessions} weekStart={weekStart.toISOString().slice(0, 10)} />
    </div>
  );
}
