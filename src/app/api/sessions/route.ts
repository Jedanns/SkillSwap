import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSessionsForUser } from "@/lib/sessions/service";
import { proposeSession, settleDueSessions, SessionError } from "@/lib/sessions/mutations";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Auto-settle past-due sessions before reading (no cron needed).
  await settleDueSessions();

  const sessions = await listSessionsForUser(user.id);
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const {
    skillId,
    studentIds,
    title,
    description,
    scheduledAt,
    durationMinutes,
    isPublic,
    kind,
    conversationId,
    rubricId,
  } = body as Record<string, unknown>;

  if (typeof skillId !== "string") {
    return NextResponse.json({ error: "Compétence requise." }, { status: 400 });
  }
  const ids = Array.isArray(studentIds)
    ? studentIds.filter((s): s is string => typeof s === "string")
    : typeof body.studentId === "string"
      ? [body.studentId as string]
      : [];

  const when = typeof scheduledAt === "string" ? new Date(scheduledAt) : new Date(NaN);

  try {
    const session = await proposeSession({
      tutorId: user.id,
      skillId,
      studentIds: ids,
      title: typeof title === "string" ? title : "",
      description: typeof description === "string" ? description : null,
      scheduledAt: when,
      durationMinutes: typeof durationMinutes === "number" ? durationMinutes : 60,
      isPublic: Boolean(isPublic),
      kind: kind === "EVALUATION" ? "EVALUATION" : "TUTORING",
      conversationId: typeof conversationId === "string" ? conversationId : null,
      rubricId: typeof rubricId === "string" ? rubricId : null,
    });
    return NextResponse.json(session, { status: 201 });
  } catch (e) {
    if (e instanceof SessionError) {
      const status = e.code === "FORBIDDEN" ? 403 : e.code === "CANNOT_TEACH" ? 403 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
