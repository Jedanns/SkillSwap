import { prisma } from "@/lib/prisma";
import type { TransactionClient } from "./award";

// Per-skill progression curve (Volet 6). Deliberately short so a motivated
// tutor reaches Expert (certifies the skill) in a handful of positive sessions.
// Index i => XP required to reach level (i + 1). Tunable during balancing.
const SKILL_LEVEL_MIN_XP = [0, 100, 250, 450, 700];

// XP granted to the tutor's UserSkill for one positively-reviewed session.
export const SKILL_XP_PER_POSITIVE_SESSION = 100;

// Rating (out of 5) at/above which a tutoring session is "positive" and grants
// skill XP toward Expert.
export const POSITIVE_RATING_THRESHOLD = 4;

export function skillLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < SKILL_LEVEL_MIN_XP.length; i++) {
    if (xp >= SKILL_LEVEL_MIN_XP[i]) level = i + 1;
  }
  return level;
}

export function tierForLevel(level: number): "HOLDER" | "EXPERT" | "MASTER" {
  if (level >= 5) return "MASTER";
  if (level >= 3) return "EXPERT";
  return "HOLDER";
}

export function skillXpToNextLevel(xp: number): number | null {
  const level = skillLevelFromXp(xp);
  if (level >= SKILL_LEVEL_MIN_XP.length) return null; // maxed
  return SKILL_LEVEL_MIN_XP[level] - xp;
}

/**
 * Picks the holder whose custom presentation is shown on the public skill page:
 * the highest combined (tutor + account) level among ACTIVE holders. Writes the
 * denormalized `Skill.featuredUserSkillId`.
 */
export async function recomputeFeaturedHolder(
  tx: TransactionClient,
  skillId: string,
): Promise<void> {
  const holders = await tx.userSkill.findMany({
    where: { skillId, status: "ACTIVE" },
    select: {
      id: true,
      profile: { select: { tutorLevel: true, accountLevel: true } },
    },
  });
  if (holders.length === 0) return;

  const best = holders.reduce((a, b) => {
    const sa = a.profile.tutorLevel + a.profile.accountLevel;
    const sb = b.profile.tutorLevel + b.profile.accountLevel;
    return sb > sa ? b : a;
  });

  await tx.skill.update({
    where: { id: skillId },
    data: { featuredUserSkillId: best.id },
  });
}

export interface SkillAwardResult {
  newLevel: number;
  newTier: "HOLDER" | "EXPERT" | "MASTER";
  leveledUp: boolean;
  becameExpert: boolean;
}

/**
 * Grants XP to a single UserSkill and promotes its tier/canTeach. When a holder
 * first reaches Expert the parent Skill is certified (if not already) and the
 * holders are notified. Runs inside the caller's transaction.
 */
export async function awardSkillXp(
  tx: TransactionClient,
  userSkillId: string,
  amount: number,
  reason: string,
): Promise<SkillAwardResult> {
  const us = await tx.userSkill.findUniqueOrThrow({
    where: { id: userSkillId },
    select: { xp: true, level: true, tier: true, skillId: true, profileId: true },
  });

  const newXp = us.xp + amount;
  const newLevel = skillLevelFromXp(newXp);
  const newTier = tierForLevel(newLevel);
  const leveledUp = newLevel > us.level;
  const becameExpert =
    us.tier === "HOLDER" && (newTier === "EXPERT" || newTier === "MASTER");

  await tx.userSkill.update({
    where: { id: userSkillId },
    data: {
      xp: newXp,
      level: newLevel,
      tier: newTier,
      canTeach: newTier !== "HOLDER" ? true : undefined,
    },
  });

  await tx.activityEvent.create({
    data: {
      profileId: us.profileId,
      type: "SKILL_ATTRIBUTED",
      xpAwarded: amount,
      metadata: { reason, skillId: us.skillId },
    },
  });

  if (leveledUp) {
    await tx.notification.create({
      data: {
        recipientId: us.profileId,
        type: "LEVEL_UP",
        entityType: "skill",
        entityId: us.skillId,
        data: { skillLevel: newLevel, tier: newTier, reason },
      },
    });
  }

  // First Expert on the skill ⇒ certify it.
  if (us.tier === "HOLDER" && (newTier === "EXPERT" || newTier === "MASTER")) {
    const skill = await tx.skill.findUniqueOrThrow({
      where: { id: us.skillId },
      select: { isCertified: true, name: true },
    });
    if (!skill.isCertified) {
      await tx.skill.update({
        where: { id: us.skillId },
        data: {
          isCertified: true,
          certifiedAt: new Date(),
          certifiedById: us.profileId,
        },
      });
      const holders = await tx.userSkill.findMany({
        where: { skillId: us.skillId, status: "ACTIVE" },
        select: { profileId: true },
      });
      if (holders.length > 0) {
        await tx.notification.createMany({
          data: holders.map((h) => ({
            recipientId: h.profileId,
            type: "SKILL_CERTIFIED" as const,
            actorId: us.profileId,
            entityType: "skill",
            entityId: us.skillId,
            data: { skillName: skill.name },
          })),
        });
      }
    }
  }

  await recomputeFeaturedHolder(tx, us.skillId);

  return { newLevel, newTier, leveledUp, becameExpert };
}

/**
 * Called after a tutoring session review. On a positive rating the tutor's
 * UserSkill for that skill gains XP (driving the path to Expert/certification).
 * Idempotent per (session, userSkill) via the reason string used as a guard.
 */
export async function onTutorSkillProgress(params: {
  tutorId: string;
  skillId: string;
  sessionId: string;
  rating: number;
}): Promise<void> {
  const { tutorId, skillId, sessionId, rating } = params;
  if (rating < POSITIVE_RATING_THRESHOLD) return;

  await prisma.$transaction(async (tx) => {
    const us = await tx.userSkill.findUnique({
      where: { profileId_skillId: { profileId: tutorId, skillId } },
      select: { id: true },
    });
    if (!us) return;

    const reason = `Session positive #${sessionId}`;
    // Guard against double-award if a review is edited/resubmitted.
    const already = await tx.activityEvent.findFirst({
      where: {
        profileId: tutorId,
        type: "SKILL_ATTRIBUTED",
        metadata: { path: ["reason"], equals: reason },
      },
      select: { id: true },
    });
    if (already) return;

    await awardSkillXp(tx, us.id, SKILL_XP_PER_POSITIVE_SESSION, reason);
  });
}

/**
 * Grants a certified skill to a student who passed an expert evaluation, with
 * the right to teach it. Idempotent: re-running upserts the same ACTIVE skill.
 */
export async function grantSkillFromEvaluation(params: {
  studentId: string;
  skillId: string;
}): Promise<void> {
  const { studentId, skillId } = params;
  await prisma.userSkill.upsert({
    where: { profileId_skillId: { profileId: studentId, skillId } },
    update: { status: "ACTIVE", source: "EVALUATION", canTeach: true },
    create: {
      profileId: studentId,
      skillId,
      source: "EVALUATION",
      status: "ACTIVE",
      canTeach: true,
    },
  });
}
