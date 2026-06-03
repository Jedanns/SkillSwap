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
      _count: { select: { holders: true } },
    },
    orderBy: [{ heatScore: "desc" }, { name: "asc" }],
  });
}

// Notions 

export type AddNotionsInput = {
  title: string;
  description?: string;
}[];

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
    },
    include: {
      skill: { select: { name: true, slug: true } },
    },
  });
}

export async function addNotionsToSkill(skillId: string, notions: AddNotionsInput) {
  // Get current max position to append after existing notions
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
        include: {
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
    data: { profileId, skillId, source: "SELF_ATTRIBUTED" },
    include: { skill: { select: { name: true, slug: true } } },
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

// Pings (a request to learn a skill)

export async function createPing(requesterId: string, skillId: string, message?: string) {
  const existing = await prisma.skillPing.findFirst({
    where: { requesterId, skillId, status: "OPEN" },
  });

  if (existing) return { alreadyExists: true as const, ping: existing };

  const ping = await prisma.skillPing.create({
    data: { requesterId, skillId, message },
  });
  return { alreadyExists: false as const, ping };
}
