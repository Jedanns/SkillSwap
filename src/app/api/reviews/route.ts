import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { onReviewSubmitted } from "@/lib/xp/events";
import { onTutorSkillProgress, grantSkillFromEvaluation } from "@/lib/xp/skill";
import { recomputeReputation } from "@/lib/reputation";
import { markSessionCompletedIfReady } from "@/lib/sessions/mutations";

type NotionInput = { rubricCriterionId?: string; label?: string; acquired?: boolean };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { sessionId, revieweeId, comment, score, passed, rubricId, notions } =
    body as Record<string, unknown>;
  const rating = Number((body as Record<string, unknown>).rating);

  if (typeof sessionId !== "string" || typeof revieweeId !== "string") {
    return NextResponse.json({ error: "Session et destinataire requis." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide (1 à 5)." }, { status: 400 });
  }

  const session = await prisma.tutoringSession.findUnique({
    where: { id: sessionId },
    select: {
      tutorId: true,
      skillId: true,
      kind: true,
      status: true,
      participants: { select: { studentId: true, attended: true } },
    },
  });
  if (!session) {
    return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  }
  if (session.status !== "AWAITING_FEEDBACK" && session.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Le feedback n'est pas encore disponible pour cette session." },
      { status: 409 },
    );
  }

  const isTutor = session.tutorId === user.id;
  const attendees = session.participants.filter((p) => p.attended).map((p) => p.studentId);
  const isAttendee = attendees.includes(user.id);
  if (!isTutor && !isAttendee) {
    return NextResponse.json({ error: "Vous n'avez pas participé à cette session." }, { status: 403 });
  }

  // Direction + reviewee validation are derived from the reviewer's role.
  let direction: "STUDENT_TO_TUTOR" | "TUTOR_TO_STUDENT";
  if (isTutor) {
    direction = "TUTOR_TO_STUDENT";
    if (!attendees.includes(revieweeId)) {
      return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
    }
  } else {
    direction = "STUDENT_TO_TUTOR";
    if (revieweeId !== session.tutorId) {
      return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });
    }
  }

  const isEvaluation = session.kind === "EVALUATION" && direction === "TUTOR_TO_STUDENT";
  const notionRows: NotionInput[] = Array.isArray(notions) ? (notions as NotionInput[]) : [];

  let reviewId: string;
  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          sessionId,
          reviewerId: user.id,
          revieweeId,
          direction,
          rating,
          comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
          score: isEvaluation && typeof score === "number" ? score : null,
          passed: isEvaluation && typeof passed === "boolean" ? passed : null,
          rubricId: isEvaluation && typeof rubricId === "string" ? rubricId : null,
        },
      });

      if (notionRows.length > 0) {
        await tx.notionValidation.createMany({
          data: notionRows.map((n) => ({
            reviewId: created.id,
            rubricCriterionId: n.rubricCriterionId ?? null,
            label: n.label ?? null,
            acquired: Boolean(n.acquired),
          })),
        });
      }

      await tx.activityEvent.create({
        data: { profileId: user.id, type: "FEEDBACK_GIVEN", xpAwarded: 0 },
      });

      return created;
    });
    reviewId = review.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Vous avez déjà laissé un avis." }, { status: 409 });
    }
    throw e;
  }

  // Post-commit side effects (each idempotent).
  await onReviewSubmitted(reviewId);

  // A positively-rated tutoring session pushes the tutor's skill toward Expert.
  if (direction === "STUDENT_TO_TUTOR" && session.kind === "TUTORING") {
    await onTutorSkillProgress({
      tutorId: session.tutorId,
      skillId: session.skillId,
      sessionId,
      rating,
    });
  }

  // A passed expert evaluation grants the certified skill to the student.
  if (isEvaluation && passed === true) {
    await grantSkillFromEvaluation({ studentId: revieweeId, skillId: session.skillId });
    await prisma.notification.create({
      data: {
        recipientId: revieweeId,
        type: "EVALUATION_RESULT",
        actorId: user.id,
        entityType: "session",
        entityId: sessionId,
        data: { passed: true, score: typeof score === "number" ? score : null },
      },
    });
  } else if (isEvaluation && passed === false) {
    await prisma.notification.create({
      data: {
        recipientId: revieweeId,
        type: "EVALUATION_RESULT",
        actorId: user.id,
        entityType: "session",
        entityId: sessionId,
        data: { passed: false, score: typeof score === "number" ? score : null },
      },
    });
  }

  await recomputeReputation(revieweeId);
  await recomputeReputation(user.id);
  await markSessionCompletedIfReady(sessionId);

  return NextResponse.json({ ok: true, reviewId }, { status: 201 });
}
