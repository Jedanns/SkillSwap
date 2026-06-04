/**
 * Derived badge catalog. Badges are computed from existing Profile counters and
 * skill tiers — no extra table. Each badge has an `earned` predicate so the same
 * catalog drives both the "earned" and "locked" views on the progression page.
 */

export type BadgeInput = {
  sessionsTaught: number;
  sessionsAttended: number;
  sessionsCompleted: number;
  accountLevel: number;
  tutorLevel: number;
  studentLevel: number;
  expertSkills: number; // UserSkills at tier EXPERT or MASTER
  fiveStarCount: number; // received 5-star reviews
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  earned: boolean;
};

export function computeBadges(input: BadgeInput): Badge[] {
  const catalog: { id: string; label: string; description: string; icon: string; test: (i: BadgeInput) => boolean }[] = [
    { id: "first-teach", label: "Premier cours", description: "Animer une première session de tutorat", icon: "GraduationCap", test: (i) => i.sessionsTaught >= 1 },
    { id: "first-learn", label: "Première leçon", description: "Suivre une première session", icon: "BookOpen", test: (i) => i.sessionsAttended >= 1 },
    { id: "mentor-5", label: "Mentor", description: "Animer 5 sessions", icon: "Users", test: (i) => i.sessionsTaught >= 5 },
    { id: "mentor-25", label: "Mentor confirmé", description: "Animer 25 sessions", icon: "Award", test: (i) => i.sessionsTaught >= 25 },
    { id: "learner-5", label: "Curieux", description: "Suivre 5 sessions", icon: "Sparkles", test: (i) => i.sessionsAttended >= 5 },
    { id: "expert", label: "Expert", description: "Atteindre le niveau Expert sur une compétence", icon: "Star", test: (i) => i.expertSkills >= 1 },
    { id: "five-star", label: "5 étoiles", description: "Recevoir une évaluation 5 étoiles", icon: "Star", test: (i) => i.fiveStarCount >= 1 },
    { id: "five-star-10", label: "Étoile montante", description: "Recevoir 10 évaluations 5 étoiles", icon: "TrendingUp", test: (i) => i.fiveStarCount >= 10 },
    { id: "account-5", label: "Habitué", description: "Atteindre le niveau de compte 5", icon: "Zap", test: (i) => i.accountLevel >= 5 },
    { id: "account-10", label: "Pilier", description: "Atteindre le niveau de compte 10", icon: "Trophy", test: (i) => i.accountLevel >= 10 },
  ];

  return catalog.map((c) => ({
    id: c.id,
    label: c.label,
    description: c.description,
    icon: c.icon,
    earned: c.test(input),
  }));
}
