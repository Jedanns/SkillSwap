import { prisma } from "@/lib/prisma";
import { ACCOUNT_XP, TUTOR_XP, STUDENT_XP } from "./constants";
import { awardAccountXp, awardTutorXp, awardStudentXp } from "./award";

export interface XpGrant {
  userId: string;
  xpType: "ACCOUNT" | "TUTOR" | "STUDENT";
  amount: number;
  reason: string;
}

export interface XpSummary {
  grants: XpGrant[];
}

// Stable reason strings — also the idempotency keys in the XpTransaction ledger.
const REASON = {
  SESSION_TUTOR_ACCOUNT: "Session de tutorat terminée (tuteur)",
  SESSION_TUTOR: "Session de tutorat animée",
  SESSION_STUDENT_ACCOUNT: "Session de tutorat terminée (élève)",
  SESSION_STUDENT: "Session de tutorat suivie",
  EVAL_GIVEN: "Évaluation soumise",
  EVAL_RECEIVED: "Évaluation reçue",
  PROFILE_COMPLETE: "Profil complété",
} as const;

/**
 * Awards XP when a tutoring session completes — once. Idempotency is enforced
 * by the ledger: if a tutor grant already exists for this session we no-op, so
 * a retry or duplicate webhook can't double-award.
 */
export async function onSessionCompleted(sessionId: string): Promise<XpSummary> {
  const grants: XpGrant[] = [];

  await prisma.$transaction(async (tx) => {
    const already = await tx.xpTransaction.findFirst({
      where: { sessionId, reason: REASON.SESSION_TUTOR },
      select: { id: true },
    });
    if (already) return;

    const session = await tx.tutoringSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: {
        tutorId: true,
        participants: { where: { attended: true }, select: { studentId: true } },
      },
    });

    const { tutorId, participants } = session;

    // Tutor: account + tutor track, and bump the career counter.
    await awardAccountXp(tx, tutorId, ACCOUNT_XP.SESSION_COMPLETED, REASON.SESSION_TUTOR_ACCOUNT, sessionId);
    grants.push({ userId: tutorId, xpType: "ACCOUNT", amount: ACCOUNT_XP.SESSION_COMPLETED, reason: REASON.SESSION_TUTOR_ACCOUNT });

    await awardTutorXp(tx, tutorId, TUTOR_XP.BASE_SESSION, REASON.SESSION_TUTOR, sessionId);
    grants.push({ userId: tutorId, xpType: "TUTOR", amount: TUTOR_XP.BASE_SESSION, reason: REASON.SESSION_TUTOR });

    await tx.profile.update({
      where: { id: tutorId },
      data: { sessionsTaught: { increment: 1 } },
    });

    // Each attending student: account + student track, and bump their counter.
    for (const { studentId } of participants) {
      await awardAccountXp(tx, studentId, ACCOUNT_XP.SESSION_COMPLETED, REASON.SESSION_STUDENT_ACCOUNT, sessionId);
      grants.push({ userId: studentId, xpType: "ACCOUNT", amount: ACCOUNT_XP.SESSION_COMPLETED, reason: REASON.SESSION_STUDENT_ACCOUNT });

      await awardStudentXp(tx, studentId, STUDENT_XP.BASE_SESSION, REASON.SESSION_STUDENT, sessionId);
      grants.push({ userId: studentId, xpType: "STUDENT", amount: STUDENT_XP.BASE_SESSION, reason: REASON.SESSION_STUDENT });

      await tx.profile.update({
        where: { id: studentId },
        data: { sessionsAttended: { increment: 1 } },
      });
    }
  });

  return { grants };
}

/**
 * Awards XP for a submitted review (the peer evaluation). The rating bonus goes
 * to the reviewee on their tutor or student track depending on the direction.
 * Idempotent per reviewee + session.
 */
export async function onReviewSubmitted(reviewId: string): Promise<XpSummary> {
  const grants: XpGrant[] = [];

  await prisma.$transaction(async (tx) => {
    const review = await tx.review.findUniqueOrThrow({
      where: { id: reviewId },
      select: {
        reviewerId: true,
        revieweeId: true,
        rating: true,
        sessionId: true,
        direction: true,
      },
    });

    const { reviewerId, revieweeId, rating, sessionId, direction } = review;

    const already = await tx.xpTransaction.findFirst({
      where: { sessionId, profileId: revieweeId, reason: REASON.EVAL_RECEIVED },
      select: { id: true },
    });
    if (already) return;

    await awardAccountXp(tx, reviewerId, ACCOUNT_XP.EVALUATION_GIVEN, REASON.EVAL_GIVEN, sessionId);
    grants.push({ userId: reviewerId, xpType: "ACCOUNT", amount: ACCOUNT_XP.EVALUATION_GIVEN, reason: REASON.EVAL_GIVEN });

    await awardAccountXp(tx, revieweeId, ACCOUNT_XP.EVALUATION_RECEIVED, REASON.EVAL_RECEIVED, sessionId);
    grants.push({ userId: revieweeId, xpType: "ACCOUNT", amount: ACCOUNT_XP.EVALUATION_RECEIVED, reason: REASON.EVAL_RECEIVED });

    // STUDENT_TO_TUTOR: the reviewee is the tutor; TUTOR_TO_STUDENT: the student.
    if (direction === "STUDENT_TO_TUTOR") {
      const xp = rating * TUTOR_XP.PER_RATING_STAR;
      const reason = `Noté ${rating}/5 par l'élève`;
      await awardTutorXp(tx, revieweeId, xp, reason, sessionId);
      grants.push({ userId: revieweeId, xpType: "TUTOR", amount: xp, reason });
    } else {
      const xp = rating * STUDENT_XP.PER_RATING_STAR;
      const reason = `Noté ${rating}/5 par le tuteur`;
      await awardStudentXp(tx, revieweeId, xp, reason, sessionId);
      grants.push({ userId: revieweeId, xpType: "STUDENT", amount: xp, reason });
    }
  });

  return { grants };
}

/** One-time account XP for completing the profile. Idempotent per user. */
export async function onProfileCompleted(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const already = await tx.xpTransaction.findFirst({
      where: { profileId: userId, reason: REASON.PROFILE_COMPLETE },
      select: { id: true },
    });
    if (already) return;
    await awardAccountXp(tx, userId, ACCOUNT_XP.PROFILE_COMPLETE, REASON.PROFILE_COMPLETE);
  });
}
