import { prisma } from "@/lib/prisma";

/**
 * Match suggestions: tutors who can teach a skill the user is actively looking
 * for (an OPEN SkillPing they raised). Returns the strongest tutor per pinged
 * skill so the home dashboard can nudge a connection.
 */
export async function getMatchSuggestions(userId: string, limit = 5) {
  const pings = await prisma.skillPing.findMany({
    where: { requesterId: userId, status: "OPEN" },
    select: { skillId: true, skill: { select: { name: true, slug: true } } },
  });
  if (pings.length === 0) return [];

  const suggestions = await Promise.all(
    pings.map(async (ping) => {
      const tutor = await prisma.userSkill.findFirst({
        where: { skillId: ping.skillId, status: "ACTIVE", canTeach: true, profileId: { not: userId } },
        orderBy: [{ tier: "desc" }, { level: "desc" }],
        select: {
          tier: true,
          profile: {
            select: { id: true, username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, tutorRatingAvg: true },
          },
        },
      });
      if (!tutor) return null;
      return { skill: ping.skill, tier: tutor.tier, tutor: tutor.profile };
    }),
  );

  return suggestions.filter((s): s is NonNullable<typeof s> => s !== null).slice(0, limit);
}
