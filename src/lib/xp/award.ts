import { prisma } from "@/lib/prisma";
import { getLevelFromXp } from "./levels";

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface AwardResult {
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
}

/**
 * The three XP tracks share one shape: the running total + level live on
 * Profile (account/tutor/student columns) and every grant is appended to the
 * XpTransaction ledger. The ledger doubles as the idempotency key for
 * event-driven awards (see events.ts).
 */
export async function awardAccountXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const { accountXp, accountLevel } = await tx.profile.findUniqueOrThrow({
    where: { id: userId },
    select: { accountXp: true, accountLevel: true },
  });
  const newTotalXp = accountXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.profile.update({
    where: { id: userId },
    data: { accountXp: newTotalXp, accountLevel: newLevel },
  });
  await tx.xpTransaction.create({
    data: { profileId: userId, track: "ACCOUNT", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > accountLevel };
}

export async function awardTutorXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const { tutorXp, tutorLevel } = await tx.profile.findUniqueOrThrow({
    where: { id: userId },
    select: { tutorXp: true, tutorLevel: true },
  });
  const newTotalXp = tutorXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.profile.update({
    where: { id: userId },
    data: { tutorXp: newTotalXp, tutorLevel: newLevel },
  });
  await tx.xpTransaction.create({
    data: { profileId: userId, track: "TUTOR", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > tutorLevel };
}

export async function awardStudentXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const { studentXp, studentLevel } = await tx.profile.findUniqueOrThrow({
    where: { id: userId },
    select: { studentXp: true, studentLevel: true },
  });
  const newTotalXp = studentXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.profile.update({
    where: { id: userId },
    data: { studentXp: newTotalXp, studentLevel: newLevel },
  });
  await tx.xpTransaction.create({
    data: { profileId: userId, track: "STUDENT", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > studentLevel };
}
