import { NextRequest, NextResponse } from "next/server";
import { getSkillBySlug } from "@/lib/skills/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug);

  if (!skill) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  return NextResponse.json(skill);
}
