import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSkills, addUserSkill } from "@/lib/skills/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const skills = await getUserSkills(user.id);
  return NextResponse.json(skills);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json();
  const { skillId } = body;

  if (!skillId || typeof skillId !== "string") {
    return NextResponse.json({ error: "skillId requis" }, { status: 400 });
  }

  const userSkill = await addUserSkill(user.id, skillId);
  return NextResponse.json(userSkill, { status: 201 });
}
