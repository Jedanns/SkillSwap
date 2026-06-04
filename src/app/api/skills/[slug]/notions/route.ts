import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSkillBySlug, addNotionsToSkill } from "@/lib/skills/service";

export async function POST(
  req: NextRequest,
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

  // Only the skill's creator may add notions. RLS enforces this at the DB level
  // too, but reject explicitly here so the caller gets a clear 403.
  if (skill.createdBy.id !== user.id) {
    return NextResponse.json(
      { error: "Seul le créateur de la compétence peut ajouter des notions." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const notions = Array.isArray(body?.notions) ? body.notions : [];

  const valid = notions.filter(
    (n: unknown) =>
      typeof n === "object" && n !== null && typeof (n as { title?: unknown }).title === "string",
  );

  if (valid.length === 0) {
    return NextResponse.json(
      { error: "Au moins une notion avec un titre est requise." },
      { status: 400 },
    );
  }

  const result = await addNotionsToSkill(skill.id, valid);
  return NextResponse.json({ count: result.count }, { status: 201 });
}

