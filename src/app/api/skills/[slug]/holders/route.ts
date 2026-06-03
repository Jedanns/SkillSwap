import { NextRequest, NextResponse } from "next/server";
import { getSkillWithHolders } from "@/lib/skills/service";
import { prisma } from "@/lib/prisma";

// GET /api/skills/:slug/holders  — returns a skill with its holder list
// Accepts either a UUID id or a slug via the [slug] segment.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Try UUID first, fall back to slug lookup
  let skillId = slug;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(slug)) {
    const found = await prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!found) {
      return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
    }
    skillId = found.id;
  }

  const skill = await getSkillWithHolders(skillId);
  if (!skill) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  return NextResponse.json(skill);
}
