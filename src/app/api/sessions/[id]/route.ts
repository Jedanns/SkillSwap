import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/lib/sessions/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionById(id);

  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }

  return NextResponse.json(session);
}
