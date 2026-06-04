import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionById } from "@/lib/sessions/service";
import {
  cancelSession,
  startSession,
  endSession,
  settleDueSessions,
  SessionError,
} from "@/lib/sessions/mutations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Settle past-due sessions so the detail reflects the real state on open.
  await settleDueSessions();

  const session = await getSessionById(id);
  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(
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
    let result;
    if (action === "cancel") {
      result = await cancelSession({ sessionId: id, byUserId: user.id });
    } else if (action === "start") {
      result = await startSession({ sessionId: id, byUserId: user.id });
    } else if (action === "end" || action === "complete") {
      result = await endSession({ sessionId: id, byUserId: user.id });
    } else {
      return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
    const session = await getSessionById(id);
    return NextResponse.json({ ...result, session });
  } catch (e) {
    if (e instanceof SessionError) {
      const status =
        e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
