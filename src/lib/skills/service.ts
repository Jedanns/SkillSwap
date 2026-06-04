import { prisma } from "@/lib/prisma";

// Categories 

export async function createCategory(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return prisma.skillCategory.create({
    data: { name: name.trim(), slug },
  });
}

export async function listCategories() {
  return prisma.skillCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { skills: true } } },
  });
}

//Skills 

export type CreateSkillInput = {
  name: string;
  description?: string;
  categoryId?: string;
  createdById: string;
  notions?: { title: string; description?: string }[];
};

export async function createSkill(input: CreateSkillInput) {
  const slug = input.name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return prisma.skill.create({
    data: {
      name: input.name.trim(),
      slug,
      canonicalDescription: input.description,
      categoryId: input.categoryId,
      createdById: input.createdById,
      notions: input.notions?.length
        ? {
            create: input.notions.map((n, i) => ({
              title: n.title.trim(),
              description: n.description,
              position: i,
            })),
          }
        : undefined,
    },
    include: {
      category: true,
      notions: { orderBy: { position: "asc" } },
    },
  });
}

export async function getSkillBySlug(slug: string) {
  return prisma.skill.findUnique({
    where: { slug },
    include: {
      category: true,
      notions: { orderBy: { position: "asc" } },
      createdBy: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } },
      _count: { select: { holders: true, sessions: true } },
    },
  });
}

export async function searchSkills(query?: string, categoryId?: string) {
  return prisma.skill.findMany({
    where: {
      isDormant: false,
      ...(categoryId ? { categoryId } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { canonicalDescription: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      _count: { select: { holders: true, sessions: true, notions: true } },
    },
    orderBy: [{ heatScore: "desc" }, { name: "asc" }],
  });
}

// Claim (attribution) 

export async function claimSkill(profileId: string, skillId: string) {
  // Certified skills cannot be self-attributed
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { isCertified: true },
  });

  if (!skill) throw new Error("SKILL_NOT_FOUND");
  if (skill.isCertified) throw new Error("SKILL_CERTIFIED");

  return prisma.userSkill.create({
    data: {
      profileId,
      skillId,
      source: "SELF_ATTRIBUTED",
      // Non-certified skills can be taught freely by any holder (peer model).
      // Certified skills are blocked above, so every self-attribution can teach.
      canTeach: true,
    },
    include: {
      skill: { select: { name: true, slug: true } },
    },
  });
}

// Claim (attribution) — end

export type AddNotionsInput = {
  title: string;
  description?: string;
}[];

export async function addNotionsToSkill(skillId: string, notions: AddNotionsInput) {
  const last = await prisma.skillNotion.findFirst({
    where: { skillId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const startPosition = (last?.position ?? -1) + 1;

  return prisma.skillNotion.createMany({
    data: notions.map((n, i) => ({
      skillId,
      title: n.title.trim(),
      description: n.description,
      position: startPosition + i,
    })),
  });
}

// User skills (a profile's attributed skills)

export async function getUserSkills(profileId: string) {
  return prisma.userSkill.findMany({
    where: { profileId },
    orderBy: { acquiredAt: "desc" },
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          slug: true,
          isCertified: true,
          canonicalDescription: true,
          category: true,
          _count: { select: { holders: true, sessions: true } },
        },
      },
    },
  });
}

export async function addUserSkill(profileId: string, skillId: string) {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { isCertified: true },
  });

  if (!skill) throw new Error("SKILL_NOT_FOUND");
  if (skill.isCertified) throw new Error("SKILL_CERTIFIED");

  return prisma.userSkill.create({
    data: { profileId, skillId, source: "SELF_ATTRIBUTED", canTeach: true },
    include: {
      skill: {
        select: { id: true, name: true, slug: true, isCertified: true, category: true },
      },
    },
  });
}

/**
 * Removes a UserSkill, scoped to its owner so a user can never delete another
 * profile's skill (the route only knows the UserSkill id). Returns false when
 * nothing matched so the caller can answer 404.
 */
export async function removeUserSkill(profileId: string, userSkillId: string) {
  const { count } = await prisma.userSkill.deleteMany({
    where: { id: userSkillId, profileId },
  });
  return count > 0;
}

// Pings (a request to learn a skill) — see createPingWithNotifications below

export async function getSkillWithHolders(skillId: string) {
  return prisma.skill.findUnique({
    where: { id: skillId },
    include: {
      category: true,
      notions: { orderBy: { position: "asc" } },
      _count: { select: { holders: true, sessions: true } },
      holders: {
        where: { status: "ACTIVE" },
        orderBy: [{ tier: "desc" }, { level: "desc" }],
        take: 20,
        include: {
          profile: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
              tutorLevel: true,
              tutorRatingAvg: true,
            },
          },
        },
      },
      createdBy: {
        select: { id: true, username: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });
}

// Create a ping and notify all skill holders who can teach it
export async function createPingWithNotifications(
  requesterId: string,
  requesterName: string,
  skillId: string,
  skillName: string,
  message?: string,
) {
  const existing = await prisma.skillPing.findFirst({
    where: { requesterId, skillId, status: "OPEN" },
  });
  if (existing) return { alreadyExists: true as const, ping: existing };

  // Find all ACTIVE holders who are not the requester
  const holders = await prisma.userSkill.findMany({
    where: { skillId, status: "ACTIVE", profileId: { not: requesterId } },
    select: { profileId: true },
  });

  const [ping] = await prisma.$transaction([
    prisma.skillPing.create({
      data: { requesterId, skillId, message },
    }),
    ...holders.map((h) =>
      prisma.notification.create({
        data: {
          recipientId: h.profileId,
          type: "PING_RECEIVED",
          actorId: requesterId,
          entityType: "skill",
          entityId: skillId,
          data: { skillName, requesterName, message: message ?? null },
        },
      }),
    ),
  ]);

  return { alreadyExists: false as const, ping };
}
