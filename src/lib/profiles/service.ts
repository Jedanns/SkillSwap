import { prisma } from "@/lib/prisma";

export async function searchProfiles(query: string, limit = 50) {
  return prisma.profile.findMany({
    where: {
      isProfileComplete: true,
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      displayName: true,
      avatarUrl: true,
      headline: true,
      accountLevel: true,
      tutorRatingAvg: true,
      sessionsTaught: true,
      _count: { select: { skills: true } },
    },
    orderBy: [{ accountLevel: "desc" }, { sessionsTaught: "desc" }],
    take: limit,
  });
}
