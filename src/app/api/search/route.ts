import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const LIMIT = 6;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ skills: [], students: [], sessions: [], posts: [] });
  }

  const insensitive = { contains: q, mode: "insensitive" as const };

  const [skills, students, sessions, posts] = await Promise.all([
    prisma.skill.findMany({
      where: { isDormant: false, OR: [{ name: insensitive }, { canonicalDescription: insensitive }] },
      orderBy: [{ isCertified: "desc" }, { heatScore: "desc" }, { name: "asc" }],
      take: LIMIT,
      select: { id: true, name: true, slug: true, isCertified: true, _count: { select: { holders: true } } },
    }),
    prisma.profile.findMany({
      where: {
        id: { not: user.id },
        isProfileComplete: true,
        OR: [{ firstName: insensitive }, { lastName: insensitive }, { displayName: insensitive }, { username: insensitive }],
      },
      orderBy: { tutorLevel: "desc" },
      take: LIMIT,
      select: { id: true, username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, headline: true },
    }),
    prisma.tutoringSession.findMany({
      where: {
        OR: [{ tutorId: user.id }, { participants: { some: { studentId: user.id } } }, { isPublic: true }],
        AND: [{ OR: [{ title: insensitive }, { skill: { name: insensitive } }] }],
      },
      orderBy: { scheduledAt: "desc" },
      take: LIMIT,
      select: { id: true, title: true, status: true, skill: { select: { name: true } } },
    }),
    prisma.post.findMany({
      where: { content: insensitive },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      select: {
        id: true,
        content: true,
        author: { select: { username: true, firstName: true, lastName: true, displayName: true } },
      },
    }),
  ]);

  return NextResponse.json({ skills, students, sessions, posts });
}
