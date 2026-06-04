import { prisma } from "@/lib/prisma";

const profileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  avatarUrl: true,
} as const;

/**
 * Sessions visible to a user: the ones they tutor, the ones they participate in,
 * plus open public sessions they could still join. Scoped — never returns every
 * session on the platform.
 */
export async function listSessionsForUser(userId: string) {
  return prisma.tutoringSession.findMany({
    where: {
      OR: [
        { tutorId: userId },
        { participants: { some: { studentId: userId } } },
        { isPublic: true, status: { in: ["PROPOSED", "CONFIRMED"] } },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      tutor: { select: { ...profileSelect, headline: true } },
      skill: { select: { id: true, name: true, slug: true, category: { select: { name: true } } } },
      participants: { select: { id: true, studentId: true, status: true, attended: true } },
      _count: { select: { participants: true } },
    },
  });
}

export async function getSessionById(id: string) {
  return prisma.tutoringSession.findUnique({
    where: { id },
    include: {
      tutor: { select: { ...profileSelect, headline: true } },
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          canonicalDescription: true,
          category: { select: { name: true } },
        },
      },
      rubric: {
        select: {
          id: true,
          scale: true,
          passingScore: true,
          criteria: { orderBy: { position: "asc" }, select: { id: true, label: true } },
        },
      },
      participants: {
        include: { student: { select: profileSelect } },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        include: {
          reviewer: { select: profileSelect },
          reviewee: { select: profileSelect },
          notions: { select: { id: true, label: true, acquired: true } },
        },
      },
      _count: { select: { participants: true } },
    },
  });
}
