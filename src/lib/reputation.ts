import { prisma } from "@/lib/prisma";

/**
 * Resolved cosmetic rank from the combined account+tutor+student levels.
 * Purely derived — kept in `Profile.rankTier` as a cache for fast list rendering.
 */
export function resolveRankTier(combinedLevel: number): string {
  if (combinedLevel >= 18) return "Platine";
  if (combinedLevel >= 12) return "Or";
  if (combinedLevel >= 6) return "Argent";
  return "Bronze";
}

/**
 * Recomputes a profile's cached reputation aggregates from the source rows:
 * - tutor/student rating averages from received reviews (per direction),
 * - reliability = completed / (completed + cancelled) * 100,
 * - cosmetic rankTier from the combined level.
 *
 * Safe to call repeatedly after any session/review write — it only reads and
 * overwrites cached columns, so it is idempotent.
 */
export async function recomputeReputation(userId: string): Promise<void> {
  const [tutorAgg, studentAgg, profile] = await Promise.all([
    prisma.review.aggregate({
      where: { revieweeId: userId, direction: "STUDENT_TO_TUTOR" },
      _avg: { rating: true },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId, direction: "TUTOR_TO_STUDENT" },
      _avg: { rating: true },
    }),
    prisma.profile.findUnique({
      where: { id: userId },
      select: {
        sessionsCompleted: true,
        sessionsCancelled: true,
        accountLevel: true,
        tutorLevel: true,
        studentLevel: true,
      },
    }),
  ]);

  if (!profile) return;

  const completed = profile.sessionsCompleted;
  const cancelled = profile.sessionsCancelled;
  const denominator = completed + cancelled;
  const reliability = denominator > 0 ? (completed / denominator) * 100 : null;
  const combinedLevel = profile.accountLevel + profile.tutorLevel + profile.studentLevel;

  await prisma.profile.update({
    where: { id: userId },
    data: {
      tutorRatingAvg: tutorAgg._avg.rating ?? null,
      studentRatingAvg: studentAgg._avg.rating ?? null,
      reliabilityScore: reliability,
      rankTier: resolveRankTier(combinedLevel),
    },
  });
}
