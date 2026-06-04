import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function resolveSkill(slug: string) {
  return prisma.skill.findUnique({ where: { slug }, select: { id: true } });
}

/** Returns the signed-in expert's rubric for this skill (for the builder). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const skill = await resolveSkill(slug);
  if (!skill) return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });

  const rubric = await prisma.rubric.findUnique({
    where: { skillId_expertId: { skillId: skill.id, expertId: user.id } },
    include: { criteria: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ rubric });
}

/** Creates or replaces the signed-in expert's rubric for the skill. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const skill = await resolveSkill(slug);
  if (!skill) return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });

  // Only an Expert/Master holder may define the evaluation referential.
  const us = await prisma.userSkill.findUnique({
    where: { profileId_skillId: { profileId: user.id, skillId: skill.id } },
    select: { tier: true },
  });
  if (!us || us.tier === "HOLDER") {
    return NextResponse.json({ error: "Réservé aux experts de la compétence." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const scale = body?.scale === "OUT_OF_10" ? "OUT_OF_10" : "OUT_OF_20";
  const max = scale === "OUT_OF_10" ? 10 : 20;
  const passingScore = Number(body?.passingScore);
  if (!Number.isFinite(passingScore) || passingScore < 1 || passingScore > max) {
    return NextResponse.json({ error: `Seuil invalide (1 à ${max}).` }, { status: 400 });
  }
  const criteria: string[] = Array.isArray(body?.criteria)
    ? body.criteria.map((c: unknown) => String(c).trim()).filter(Boolean)
    : [];

  const rubric = await prisma.$transaction(async (tx) => {
    const r = await tx.rubric.upsert({
      where: { skillId_expertId: { skillId: skill.id, expertId: user.id } },
      update: { scale, passingScore },
      create: { skillId: skill.id, expertId: user.id, scale, passingScore },
    });
    await tx.rubricCriterion.deleteMany({ where: { rubricId: r.id } });
    if (criteria.length > 0) {
      await tx.rubricCriterion.createMany({
        data: criteria.map((label, i) => ({ rubricId: r.id, label, position: i })),
      });
    }
    return tx.rubric.findUnique({
      where: { id: r.id },
      include: { criteria: { orderBy: { position: "asc" } } },
    });
  });

  return NextResponse.json({ rubric }, { status: 201 });
}
