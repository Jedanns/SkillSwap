import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionById } from "@/lib/sessions/service";
import {
  respondToParticipation,
  inviteToSession,
  SessionError,
} from "@/lib/sessions/mutations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  try {
    if (action === "respond") {
      await respondToParticipation({
        sessionId: id,
        studentId: user.id,
        accept: Boolean(body?.accept),
      });
    } else if (action === "invite") {
      const studentIds = Array.isArray(body?.studentIds)
        ? body.studentIds.filter((s: unknown): s is string => typeof s === "string")
        : [];
      await inviteToSession({ sessionId: id, tutorId: user.id, studentIds });
    } else {
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    const session = await getSessionById(id);
    return NextResponse.json({ session });
  } catch (e) {
    if (e instanceof SessionError) {
      const status =
        e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
