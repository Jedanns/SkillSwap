import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPing } from "@/lib/skills/service";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { skillId, message } = body;

  if (!skillId || typeof skillId !== "string") {
    return NextResponse.json({ error: "skillId requis" }, { status: 400 });
  }

  const { alreadyExists, ping } = await createPing(user.id, skillId, message);

  if (alreadyExists) {
    return NextResponse.json(
      { error: "Vous avez déjà un ping ouvert pour cette compétence", ping },
      { status: 409 },
    );
  }

  return NextResponse.json(ping, { status: 201 });
}
