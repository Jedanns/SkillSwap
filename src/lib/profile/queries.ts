import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const profileViewSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  headline: true,
  githubUrl: true,
  linkedinUrl: true,
  accountLevel: true,
  accountXp: true,
  tutorLevel: true,
  tutorXp: true,
  studentLevel: true,
  studentXp: true,
  tutorRatingAvg: true,
  studentRatingAvg: true,
  reliabilityScore: true,
  rankTier: true,
  sessionsTaught: true,
  sessionsAttended: true,
  promotion: { select: { name: true } },
  skills: {
    where: { status: "ACTIVE" },
    orderBy: [{ tier: "desc" }, { level: "desc" }],
    select: {
      id: true,
      level: true,
      xp: true,
      tier: true,
      skill: { select: { name: true, slug: true, isCertified: true } },
    },
  },
  reviewsReceived: {
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      rating: true,
      comment: true,
      reviewer: { select: { username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.ProfileSelect;

export function getProfileByUsername(username: string) {
  return prisma.profile.findUnique({ where: { username }, select: profileViewSelect });
}

export function getProfileById(id: string) {
  return prisma.profile.findUnique({ where: { id }, select: profileViewSelect });
}

export type ProfileViewData = NonNullable<Awaited<ReturnType<typeof getProfileById>>>;
