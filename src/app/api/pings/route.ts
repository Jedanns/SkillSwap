import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPingWithNotifications } from "@/lib/skills/service";
import { prisma } from "@/lib/prisma";

/**
 * Incoming tutoring requests for the signed-in tutor: open pings on any skill
 * they can teach (and didn't raise themselves). Powers the "Demandes" inbox.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const teachable = await prisma.userSkill.findMany({
    where: { profileId: user.id, status: "ACTIVE", canTeach: true },
    select: { skillId: true },
  });
  const skillIds = teachable.map((t) => t.skillId);
  if (skillIds.length === 0) return NextResponse.json([]);

  const pings = await prisma.skillPing.findMany({
    where: { skillId: { in: skillIds }, status: "OPEN", requesterId: { not: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      skill: { select: { id: true, name: true, slug: true } },
      requester: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json(pings);
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
  const { skillId, message } = body;

  if (!skillId || typeof skillId !== "string") {
    return NextResponse.json({ error: "skillId requis" }, { status: 400 });
  }

  // Fetch requester name and skill name for notification data
  const [profile, skill] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { displayName: true, firstName: true, lastName: true, username: true },
    }),
    prisma.skill.findUnique({ where: { id: skillId }, select: { name: true } }),
  ]);

  if (!skill) {
    return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const requesterName = profile?.displayName || fullName || profile?.username || "Quelqu'un";

  const { alreadyExists, ping } = await createPingWithNotifications(
    user.id,
    requesterName,
    skillId,
    skill.name,
    typeof message === "string" ? message : undefined,
  );

  if (alreadyExists) {
    return NextResponse.json(
      { error: "Vous avez déjà un ping ouvert pour cette compétence", ping },
      { status: 409 },
    );
  }

  return NextResponse.json(ping, { status: 201 });
}

