import { prisma } from "@/lib/prisma";

export async function listSessions() {
  return prisma.tutoringSession.findMany({
    orderBy: { scheduledAt: "asc" },
    include: {
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
        },
      },
      skill: {
        select: { id: true, name: true, slug: true },
      },
      _count: { select: { participants: true } },
    },
  });
}

export async function getSessionById(id: string) {
  return prisma.tutoringSession.findUnique({
    where: { id },
    include: {
      tutor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          headline: true,
        },
      },
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          canonicalDescription: true,
          category: { select: { name: true } },
        },
      },
      participants: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}
