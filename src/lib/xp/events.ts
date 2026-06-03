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

export async function onSessionCompleted(sessionId: string): Promise<XpSummary> {
  const grants: XpGrant[] = [];

  await prisma.$transaction(async (tx) => {
    const session = await tx.tutoringSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { tutorId: true, studentId: true },
    });

    const { tutorId, studentId } = session;

    // Increment session counters, creating rows if needed
    await tx.tutorProgression.upsert({
      where: { userId: tutorId },
      create: { userId: tutorId, sessionsTaught: 1 },
      update: { sessionsTaught: { increment: 1 } },
    });
    await tx.studentProgression.upsert({
      where: { userId: studentId },
      create: { userId: studentId, sessionsAttended: 1 },
      update: { sessionsAttended: { increment: 1 } },
    });

    // Award XP to tutor
    await awardAccountXp(tx, tutorId, ACCOUNT_XP.SESSION_COMPLETED, "Completed tutoring session", sessionId);
    grants.push({ userId: tutorId, xpType: "ACCOUNT", amount: ACCOUNT_XP.SESSION_COMPLETED, reason: "Completed tutoring session" });

    await awardTutorXp(tx, tutorId, TUTOR_XP.BASE_SESSION, "Tutoring session completed", sessionId);
    grants.push({ userId: tutorId, xpType: "TUTOR", amount: TUTOR_XP.BASE_SESSION, reason: "Tutoring session completed" });

    // Award XP to student
    await awardAccountXp(tx, studentId, ACCOUNT_XP.SESSION_COMPLETED, "Completed learning session", sessionId);
    grants.push({ userId: studentId, xpType: "ACCOUNT", amount: ACCOUNT_XP.SESSION_COMPLETED, reason: "Completed learning session" });

    await awardStudentXp(tx, studentId, STUDENT_XP.BASE_SESSION, "Learning session completed", sessionId);
    grants.push({ userId: studentId, xpType: "STUDENT", amount: STUDENT_XP.BASE_SESSION, reason: "Learning session completed" });
  });

  return { grants };
}

export async function onEvaluationSubmitted(evaluationId: string): Promise<XpSummary> {
  const grants: XpGrant[] = [];

  await prisma.$transaction(async (tx) => {
    const evaluation = await tx.sessionEvaluation.findUniqueOrThrow({
      where: { id: evaluationId },
      select: {
        evaluatorId: true,
        evaluateeId: true,
        rating: true,
        sessionId: true,
        session: { select: { tutorId: true, studentId: true } },
      },
    });

    const { evaluatorId, evaluateeId, rating, sessionId, session } = evaluation;

    await awardAccountXp(tx, evaluatorId, ACCOUNT_XP.EVALUATION_GIVEN, "Submitted evaluation", sessionId);
    grants.push({ userId: evaluatorId, xpType: "ACCOUNT", amount: ACCOUNT_XP.EVALUATION_GIVEN, reason: "Submitted evaluation" });

    await awardAccountXp(tx, evaluateeId, ACCOUNT_XP.EVALUATION_RECEIVED, "Received evaluation", sessionId);
    grants.push({ userId: evaluateeId, xpType: "ACCOUNT", amount: ACCOUNT_XP.EVALUATION_RECEIVED, reason: "Received evaluation" });

    if (evaluateeId === session.tutorId) {
      const xp = rating * TUTOR_XP.PER_RATING_STAR;
      await awardTutorXp(tx, evaluateeId, xp, `Student rated session ${rating}/5`, sessionId);
      grants.push({ userId: evaluateeId, xpType: "TUTOR", amount: xp, reason: `Student rated session ${rating}/5` });
    } else if (evaluateeId === session.studentId) {
      const xp = rating * STUDENT_XP.PER_RATING_STAR;
      await awardStudentXp(tx, evaluateeId, xp, `Tutor rated session ${rating}/5`, sessionId);
      grants.push({ userId: evaluateeId, xpType: "STUDENT", amount: xp, reason: `Tutor rated session ${rating}/5` });
    }
  });

  return { grants };
}

export async function onProfileCompleted(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await awardAccountXp(tx, userId, ACCOUNT_XP.PROFILE_COMPLETE, "Completed profile");
  });
}
