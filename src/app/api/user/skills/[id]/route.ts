import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { removeUserSkill } from "@/lib/skills/service";
import { recomputeFeaturedHolder } from "@/lib/xp/skill";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const result = await removeUserSkill(user.id, id);

  if (!result) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * Customize "my version" of a skill — the per-holder presentation (title, rich
 * description, image) shown on the public skill page when this holder is the
 * featured (highest-level) one. Owner-scoped.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const owned = await prisma.userSkill.findFirst({
    where: { id, profileId: user.id },
    select: { id: true, skillId: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const updated = await prisma.userSkill.update({
    where: { id },
    data: {
      customTitle: clean(body?.customTitle),
      customDescription: clean(body?.customDescription),
      customImageUrl: clean(body?.customImageUrl),
    },
    select: { id: true, customTitle: true, customDescription: true, customImageUrl: true },
  });

  // The featured presentation may need re-pointing (no-op if already correct).
  await prisma.$transaction((tx) => recomputeFeaturedHolder(tx, owned.skillId));

  return NextResponse.json(updated);
}
