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

  try {
    const userSkill = await addUserSkill(user.id, skillId);
    return NextResponse.json(userSkill, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SKILL_NOT_FOUND") {
      return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
    }
    if (msg === "SKILL_CERTIFIED") {
      return NextResponse.json(
        { error: "Cette compétence est certifiée. Une session d'évaluation est requise." },
        { status: 403 },
      );
    }
    // Unique constraint — skill already in portfolio
    const isUnique =
      typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
    if (isUnique) {
      return NextResponse.json({ error: "Compétence déjà dans votre portfolio." }, { status: 409 });
    }
    console.error("[POST /api/user/skills]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
