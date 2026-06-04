import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TransactionClient } from "@/lib/xp/award";
import { onSessionCompleted } from "@/lib/xp/events";
import { recomputeReputation } from "@/lib/reputation";

/**
 * Session lifecycle (Volet 3 & 4). State machine:
 *   PROPOSED → CONFIRMED → IN_PROGRESS → AWAITING_FEEDBACK → COMPLETED
 *                    ↘ CANCELLED (from PROPOSED/CONFIRMED)
 *
 * Base session XP + attendance + reliability counters are awarded ONCE when a
 * session enters AWAITING_FEEDBACK (via `finalizeSession`), whether reached by
 * the tutor pressing "Terminer" or by the lazy auto-settle. Rating XP is added
 * later when reviews land; the session flips to COMPLETED once feedback is in.
 */

export class SessionError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "INVALID_STATE"
      | "CANNOT_TEACH"
      | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "SessionError";
  }
}

type NotifInput = {
  recipientId: string;
  type:
    | "SESSION_PROPOSED"
    | "SESSION_INVITED"
    | "SESSION_APPROVED"
    | "SESSION_DECLINED"
    | "SESSION_CANCELLED"
    | "SESSION_COMPLETED"
    | "FEEDBACK_REQUEST";
  actorId?: string;
  sessionId: string;
  data?: Record<string, unknown>;
};

function notify(tx: TransactionClient, n: NotifInput) {
  return tx.notification.create({
    data: {
      recipientId: n.recipientId,
      type: n.type,
      actorId: n.actorId ?? null,
      entityType: "session",
      entityId: n.sessionId,
      data: n.data ? (n.data as Prisma.InputJsonValue) : undefined,
    },
  });
}

// ─────────────────────────────── Propose ───────────────────────────────

export interface ProposeSessionInput {
  tutorId: string;
  skillId: string;
  studentIds: string[];
  title: string;
  description?: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  isPublic?: boolean;
  kind?: "TUTORING" | "EVALUATION";
  conversationId?: string | null;
  rubricId?: string | null;
}

export async function proposeSession(input: ProposeSessionInput) {
  const {
    tutorId,
    skillId,
    studentIds,
    title,
    description,
    scheduledAt,
    durationMinutes,
    isPublic = false,
    kind = "TUTORING",
    conversationId = null,
    rubricId = null,
  } = input;

  if (!title.trim()) throw new SessionError("VALIDATION", "Le titre est requis.");
  if (!Number.isFinite(scheduledAt.getTime()))
    throw new SessionError("VALIDATION", "Date invalide.");
  if (!durationMinutes || durationMinutes < 15 || durationMinutes > 480)
    throw new SessionError("VALIDATION", "Durée invalide (15–480 min).");
  const targets = [...new Set(studentIds.filter((s) => s && s !== tutorId))];
  if (targets.length === 0)
    throw new SessionError("VALIDATION", "Aucun élève destinataire.");

  // The tutor must hold the skill with the right to teach it. For EVALUATION the
  // tutor must additionally be Expert/Master on the skill.
  const tutorSkill = await prisma.userSkill.findUnique({
    where: { profileId_skillId: { profileId: tutorId, skillId } },
    select: { canTeach: true, tier: true },
  });
  if (!tutorSkill || !tutorSkill.canTeach) {
    throw new SessionError(
      "CANNOT_TEACH",
      "Vous ne pouvez pas tutorer cette compétence.",
    );
  }
  if (kind === "EVALUATION" && tutorSkill.tier === "HOLDER") {
    throw new SessionError(
      "CANNOT_TEACH",
      "Seul un expert peut évaluer cette compétence.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.tutoringSession.create({
      data: {
        tutorId,
        skillId,
        conversationId,
        kind,
        rubricId,
        title: title.trim(),
        description: description?.trim() || null,
        scheduledAt,
        durationMinutes,
        isPublic,
        status: "PROPOSED",
        participants: {
          create: targets.map((studentId) => ({ studentId, status: "PENDING" })),
        },
      },
      include: { skill: { select: { name: true } } },
    });

    await Promise.all(
      targets.map((studentId) =>
        notify(tx, {
          recipientId: studentId,
          type: "SESSION_PROPOSED",
          actorId: tutorId,
          sessionId: session.id,
          data: { title: session.title, skillName: session.skill.name, kind },
        }),
      ),
    );

    return session;
  });
}

// ─────────────────────────── Invite (public) ───────────────────────────

export async function inviteToSession(params: {
  sessionId: string;
  tutorId: string;
  studentIds: string[];
}) {
  const { sessionId, tutorId, studentIds } = params;
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: { tutorId: true, status: true, title: true, skill: { select: { name: true } } },
  });
  if (!session) throw new SessionError("NOT_FOUND", "Session introuvable.");
  if (session.tutorId !== tutorId)
    throw new SessionError("FORBIDDEN", "Seul le tuteur peut inviter.");
  if (session.status !== "PROPOSED" && session.status !== "CONFIRMED")
    throw new SessionError("INVALID_STATE", "Session non ouverte aux invitations.");

  const targets = [...new Set(studentIds.filter((s) => s && s !== tutorId))];

  return prisma.$transaction(async (tx) => {
    for (const studentId of targets) {
      await tx.sessionParticipant.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        update: {},
        create: {
          sessionId,
          studentId,
          status: "INVITED",
          invitedById: tutorId,
          invitedAt: new Date(),
        },
      });
      await notify(tx, {
        recipientId: studentId,
        type: "SESSION_INVITED",
        actorId: tutorId,
        sessionId,
        data: { title: session.title, skillName: session.skill.name },
      });
    }
    return { invited: targets.length };
  });
}

// ───────────────────────────── Respond ─────────────────────────────────

export async function respondToParticipation(params: {
  sessionId: string;
  studentId: string;
  accept: boolean;
}) {
  const { sessionId, studentId, accept } = params;

  return prisma.$transaction(async (tx) => {
    const participant = await tx.sessionParticipant.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
      select: { id: true, status: true },
    });
    if (!participant)
      throw new SessionError("NOT_FOUND", "Vous n'êtes pas convié à cette session.");
    if (participant.status !== "PENDING" && participant.status !== "INVITED")
      throw new SessionError("INVALID_STATE", "Vous avez déjà répondu.");

    const session = await tx.tutoringSession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { id: true, tutorId: true, status: true, skillId: true, title: true },
    });

    await tx.sessionParticipant.update({
      where: { id: participant.id },
      data: { status: accept ? "APPROVED" : "DECLINED" },
    });

    if (accept) {
      // First approval confirms the session.
      if (session.status === "PROPOSED") {
        await tx.tutoringSession.update({
          where: { id: sessionId },
          data: { status: "CONFIRMED" },
        });
      }
      // Resolve any open ping this student raised for the skill.
      await tx.skillPing.updateMany({
        where: { requesterId: studentId, skillId: session.skillId, status: "OPEN" },
        data: { status: "RESOLVED", resolvedAt: new Date(), resolvedBySessionId: sessionId },
      });
    }

    await notify(tx, {
      recipientId: session.tutorId,
      type: accept ? "SESSION_APPROVED" : "SESSION_DECLINED",
      actorId: studentId,
      sessionId,
      data: { title: session.title },
    });

    return { status: accept ? "APPROVED" : "DECLINED" };
  });
}

// ───────────────────────────── Cancel ──────────────────────────────────

export async function cancelSession(params: { sessionId: string; byUserId: string }) {
  const { sessionId, byUserId } = params;

  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: {
      tutorId: true,
      status: true,
      title: true,
      participants: { select: { studentId: true } },
    },
  });
  if (!session) throw new SessionError("NOT_FOUND", "Session introuvable.");

  const isTutor = session.tutorId === byUserId;
  const isParticipant = session.participants.some((p) => p.studentId === byUserId);
  if (!isTutor && !isParticipant)
    throw new SessionError("FORBIDDEN", "Action non autorisée.");
  if (session.status !== "PROPOSED" && session.status !== "CONFIRMED")
    throw new SessionError("INVALID_STATE", "Cette session ne peut plus être annulée.");

  await prisma.$transaction(async (tx) => {
    await tx.tutoringSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelledById: byUserId },
    });
    await tx.profile.update({
      where: { id: byUserId },
      data: { sessionsCancelled: { increment: 1 } },
    });

    // Notify everyone else involved.
    const recipients = new Set<string>([
      session.tutorId,
      ...session.participants.map((p) => p.studentId),
    ]);
    recipients.delete(byUserId);
    for (const recipientId of recipients) {
      await notify(tx, {
        recipientId,
        type: "SESSION_CANCELLED",
        actorId: byUserId,
        sessionId,
        data: { title: session.title },
      });
    }
  });

  await recomputeReputation(byUserId);
  return { status: "CANCELLED" as const };
}

// ───────────────────────────── Start ───────────────────────────────────

export async function startSession(params: { sessionId: string; byUserId: string }) {
  const { sessionId, byUserId } = params;
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: {
      tutorId: true,
      status: true,
      participants: { select: { studentId: true } },
    },
  });
  if (!session) throw new SessionError("NOT_FOUND", "Session introuvable.");
  const allowed =
    session.tutorId === byUserId ||
    session.participants.some((p) => p.studentId === byUserId);
  if (!allowed) throw new SessionError("FORBIDDEN", "Action non autorisée.");
  if (session.status !== "CONFIRMED")
    throw new SessionError("INVALID_STATE", "La session doit être confirmée pour démarrer.");

  await prisma.tutoringSession.update({
    where: { id: sessionId },
    data: { status: "IN_PROGRESS" },
  });
  return { status: "IN_PROGRESS" as const };
}

// ─────────────────────── End / finalize (XP) ───────────────────────────

/**
 * Moves a session to AWAITING_FEEDBACK and awards base XP + attendance +
 * reliability counters exactly once. Shared by the manual "Terminer" action and
 * the lazy auto-settle. No-ops if the session already left the active states.
 */
async function finalizeSession(sessionId: string): Promise<boolean> {
  const transitioned = await prisma.$transaction(async (tx) => {
    const session = await tx.tutoringSession.findUnique({
      where: { id: sessionId },
      select: {
        status: true,
        tutorId: true,
        title: true,
        participants: {
          where: { status: "APPROVED" },
          select: { studentId: true },
        },
      },
    });
    if (!session) return null;
    if (session.status !== "CONFIRMED" && session.status !== "IN_PROGRESS") return null;

    await tx.sessionParticipant.updateMany({
      where: { sessionId, status: "APPROVED" },
      data: { attended: true },
    });

    const studentIds = session.participants.map((p) => p.studentId);

    // Reliability counters (separate from the career counters bumped by XP).
    await tx.profile.update({
      where: { id: session.tutorId },
      data: { sessionsCompleted: { increment: 1 } },
    });
    for (const studentId of studentIds) {
      await tx.profile.update({
        where: { id: studentId },
        data: { sessionsCompleted: { increment: 1 } },
      });
    }

    await tx.tutoringSession.update({
      where: { id: sessionId },
      data: { status: "AWAITING_FEEDBACK" },
    });

    // Feedback prompts: the tutor rates each attendee, each attendee rates the tutor.
    await notify(tx, {
      recipientId: session.tutorId,
      type: "FEEDBACK_REQUEST",
      sessionId,
      data: { title: session.title, role: "tutor" },
    });
    for (const studentId of studentIds) {
      await notify(tx, {
        recipientId: studentId,
        type: "FEEDBACK_REQUEST",
        sessionId,
        data: { title: session.title, role: "student" },
      });
    }

    return { tutorId: session.tutorId, studentIds };
  });

  if (!transitioned) return false;

  // Base session XP — idempotent via the XP ledger. Reads attendance committed above.
  await onSessionCompleted(sessionId);
  await recomputeReputation(transitioned.tutorId);
  for (const studentId of transitioned.studentIds) {
    await recomputeReputation(studentId);
  }
  return true;
}

export async function endSession(params: { sessionId: string; byUserId: string }) {
  const { sessionId, byUserId } = params;
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: {
      tutorId: true,
      status: true,
      participants: { select: { studentId: true } },
    },
  });
  if (!session) throw new SessionError("NOT_FOUND", "Session introuvable.");
  const allowed =
    session.tutorId === byUserId ||
    session.participants.some((p) => p.studentId === byUserId);
  if (!allowed) throw new SessionError("FORBIDDEN", "Action non autorisée.");
  if (session.status !== "CONFIRMED" && session.status !== "IN_PROGRESS")
    throw new SessionError("INVALID_STATE", "Cette session ne peut pas être terminée.");

  await finalizeSession(sessionId);
  return { status: "AWAITING_FEEDBACK" as const };
}

/**
 * Lazy settlement: any CONFIRMED/IN_PROGRESS session whose end time has passed
 * is finalized. Called on session-list / planning reads so no cron is required.
 */
export async function settleDueSessions(): Promise<number> {
  const now = new Date();
  // Coarse pre-filter in SQL (scheduledAt < now), exact end-time check in JS.
  const candidates = await prisma.tutoringSession.findMany({
    where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] }, scheduledAt: { lt: now } },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });

  let settled = 0;
  for (const s of candidates) {
    const endsAt = new Date(s.scheduledAt.getTime() + s.durationMinutes * 60_000);
    if (endsAt <= now) {
      if (await finalizeSession(s.id)) settled++;
    }
  }
  return settled;
}

/**
 * Flips an AWAITING_FEEDBACK session to COMPLETED once every expected review is
 * in (each attendee ↔ tutor, both directions). Called after a review is saved.
 */
export async function markSessionCompletedIfReady(sessionId: string): Promise<void> {
  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: {
      status: true,
      tutorId: true,
      participants: { where: { attended: true }, select: { studentId: true } },
      _count: { select: { reviews: true } },
    },
  });
  if (!session || session.status !== "AWAITING_FEEDBACK") return;

  const attendees = session.participants.length;
  const expected = attendees * 2; // student→tutor + tutor→student per attendee
  if (expected === 0 || session._count.reviews < expected) return;

  await prisma.$transaction(async (tx) => {
    await tx.tutoringSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    const recipients = new Set<string>([
      session.tutorId,
      ...session.participants.map((p) => p.studentId),
    ]);
    for (const recipientId of recipients) {
      await notify(tx, { recipientId, type: "SESSION_COMPLETED", sessionId });
    }
  });
}
