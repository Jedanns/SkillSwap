import { prisma } from "@/lib/prisma";
import { getLevelFromXp } from "./levels";

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export interface AwardResult {
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export async function awardAccountXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const current = await tx.accountProgression.upsert({
    where: { userId },
    create: { userId, totalXp: 0, level: 1 },
    update: {},
    select: { totalXp: true, level: true },
  });
  const newTotalXp = current.totalXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.accountProgression.update({
    where: { userId },
    data: { totalXp: newTotalXp, level: newLevel },
  });
  await tx.xpTransaction.create({
    data: { userId, xpType: "ACCOUNT", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > current.level };
}

export async function awardTutorXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const current = await tx.tutorProgression.upsert({
    where: { userId },
    create: { userId, totalXp: 0, level: 1 },
    update: {},
    select: { totalXp: true, level: true },
  });
  const newTotalXp = current.totalXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.tutorProgression.update({
    where: { userId },
    data: { totalXp: newTotalXp, level: newLevel },
  });
  await tx.xpTransaction.create({
    data: { userId, xpType: "TUTOR", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > current.level };
}

export async function awardStudentXp(
  tx: TransactionClient,
  userId: string,
  amount: number,
  reason: string,
  sessionId?: string,
): Promise<AwardResult> {
  const current = await tx.studentProgression.upsert({
    where: { userId },
    create: { userId, totalXp: 0, level: 1 },
    update: {},
    select: { totalXp: true, level: true },
  });
  const newTotalXp = current.totalXp + amount;
  const newLevel = getLevelFromXp(newTotalXp);
  await tx.studentProgression.update({
    where: { userId },
    data: { totalXp: newTotalXp, level: newLevel },
  });
  await tx.xpTransaction.create({
    data: { userId, xpType: "STUDENT", amount, reason, sessionId: sessionId ?? null },
  });
  return { newTotalXp, newLevel, leveledUp: newLevel > current.level };
}
