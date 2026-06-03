import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSkillBySlug, claimSkill } from "@/lib/skills/service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { slug } = await params;
  const skill = await getSkillBySlug(slug);
  if (!skill) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  try {
    const userSkill = await claimSkill(user.id, skill.id);
    return NextResponse.json(userSkill, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "SKILL_CERTIFIED") {
        return NextResponse.json(
          { error: "Cette compétence est certifiée, elle ne peut pas être auto-attribuée." },
          { status: 403 },
        );
      }
    }

    const isUniqueViolation =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002";

    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "Tu possèdes déjà cette compétence." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
