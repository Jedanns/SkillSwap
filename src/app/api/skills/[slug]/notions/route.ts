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
