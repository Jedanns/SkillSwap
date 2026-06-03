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

// Notions 

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
