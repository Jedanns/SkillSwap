/**
 * Comprehensive dev seed for SkillSwap.
 *
 * Profiles are 1:1 with Supabase `auth.users` (a DB trigger creates the profile
 * row on signup), so we first create confirmed auth users via the Admin API,
 * then fill profiles + all app data with Prisma.
 *
 * Run:  npx tsx prisma/seed.ts
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, DATABASE_URL (in .env)
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;
const PASSWORD = "Password123!";

// XP needed to reach a level: (n-1)*n*50  (mirrors src/lib/xp/levels.ts).
const xpForLevel = (n: number) => (n - 1) * n * 50;

type UserSeed = { key: string; first: string; last: string; username: string; headline: string; bio: string };

const USERS: UserSeed[] = [
  { key: "lucas", first: "Lucas", last: "Martin", username: "lucasmartin", headline: "Lead front-end · React & TypeScript", bio: "J'adore transmettre. Expert React, je tutore depuis 2 ans sur le campus." },
  { key: "emma", first: "Emma", last: "Bernard", username: "emmabernard", headline: "Product designer · Figma addict", bio: "Design systems, prototypage et UI. Toujours partante pour un atelier Figma." },
  { key: "hugo", first: "Hugo", last: "Petit", username: "hugopetit", headline: "Back-end Node.js", bio: "APIs, perf et bonnes pratiques. J'apprends le front en parallèle." },
  { key: "lea", first: "Léa", last: "Dubois", username: "leadubois", headline: "Étudiante B3 · curieuse de tout", bio: "Je veux progresser en React et en design." },
  { key: "noah", first: "Noah", last: "Moreau", username: "noahmoreau", headline: "Data & Python", bio: "Machine learning, pandas, notebooks. Je cherche à enseigner la data." },
  { key: "chloe", first: "Chloé", last: "Laurent", username: "chloelaurent", headline: "Fullstack en devenir", bio: "Entre deux projets, j'apprends Python et Docker." },
  { key: "jules", first: "Jules", last: "Simon", username: "julessimon", headline: "DevOps · Docker & CI", bio: "Conteneurs, pipelines et infra. Je partage volontiers." },
  { key: "manon", first: "Manon", last: "Michel", username: "manonmichel", headline: "Soft skills & prise de parole", bio: "Communication, pitch, organisation d'ateliers." },
  { key: "louis", first: "Louis", last: "Garcia", username: "louisgarcia", headline: "Git & outils", bio: "Workflow Git, rebase sans peur." },
  { key: "camille", first: "Camille", last: "Roux", username: "camilleroux", headline: "Apprentie développeuse", bio: "Je débute et je veux tout apprendre !" },
];

type SkillSeed = {
  key: string; name: string; category: string; description: string;
  createdBy: string; notions: string[];
};

const SKILLS: SkillSeed[] = [
  { key: "react", name: "React", category: "Développement", createdBy: "lucas", description: "Construire des interfaces modernes avec React 19 : composants, hooks, état, et performance.", notions: ["Composants & JSX", "Hooks (useState, useEffect)", "Gestion d'état", "Context API", "Performance & mémo"] },
  { key: "ts", name: "TypeScript", category: "Développement", createdBy: "lucas", description: "Le typage statique au service de JavaScript. Sécurité et DX.", notions: ["Types & interfaces", "Génériques", "Utility types", "Narrowing"] },
  { key: "node", name: "Node.js", category: "Développement", createdBy: "hugo", description: "Construire des APIs performantes côté serveur avec Node.", notions: ["Event loop", "Express / Fastify", "Streams", "Auth & sécurité"] },
  { key: "next", name: "Next.js", category: "Développement", createdBy: "lucas", description: "Le framework React pour la production : SSR, RSC, routing.", notions: ["App Router", "Server Components", "Server Actions", "Caching"] },
  { key: "python", name: "Python", category: "Data", createdBy: "noah", description: "Le langage polyvalent pour la data et l'automatisation.", notions: ["Syntaxe & structures", "Fonctions", "POO", "Librairies standard"] },
  { key: "ml", name: "Machine Learning", category: "Data", createdBy: "noah", description: "Comprendre et entraîner des modèles prédictifs.", notions: ["Régression", "Classification", "Évaluation", "Overfitting"] },
  { key: "sql", name: "SQL", category: "Data", createdBy: "noah", description: "Interroger et modéliser des bases relationnelles.", notions: ["SELECT & jointures", "Agrégations", "Index", "Modélisation"] },
  { key: "figma", name: "Figma", category: "Design", createdBy: "emma", description: "Maquetter, prototyper et créer des design systems.", notions: ["Auto-layout", "Composants & variants", "Prototypage", "Design tokens"] },
  { key: "uiux", name: "UI/UX Design", category: "Design", createdBy: "emma", description: "Concevoir des expériences utiles et accessibles.", notions: ["Recherche utilisateur", "Wireframes", "Accessibilité", "Tests d'utilisabilité"] },
  { key: "docker", name: "Docker", category: "DevOps", createdBy: "jules", description: "Conteneuriser ses applications de dev à la prod.", notions: ["Images & conteneurs", "Dockerfile", "Compose", "Volumes & réseaux"] },
  { key: "git", name: "Git", category: "DevOps", createdBy: "louis", description: "Maîtriser le versioning et la collaboration.", notions: ["Commits & branches", "Merge vs rebase", "Pull requests", "Résolution de conflits"] },
  { key: "comm", name: "Communication", category: "Soft skills", createdBy: "manon", description: "Présenter ses idées avec clarté et impact.", notions: ["Structurer un pitch", "Gestion du trac", "Écoute active"] },
];

// skillKey -> expert userKey (reaches Expert => the skill becomes certified)
const EXPERTS: Record<string, string> = { react: "lucas", figma: "emma", node: "hugo", python: "noah" };

// skillKey -> holders (userKeys) with their tier/level
const HOLDERS: Record<string, { user: string; tier: "HOLDER" | "EXPERT" | "MASTER"; level: number }[]> = {
  react: [{ user: "lucas", tier: "MASTER", level: 5 }, { user: "hugo", tier: "HOLDER", level: 2 }, { user: "lea", tier: "HOLDER", level: 1 }],
  ts: [{ user: "lucas", tier: "EXPERT", level: 3 }, { user: "hugo", tier: "HOLDER", level: 2 }, { user: "chloe", tier: "HOLDER", level: 1 }],
  node: [{ user: "hugo", tier: "EXPERT", level: 3 }, { user: "chloe", tier: "HOLDER", level: 1 }],
  next: [{ user: "lucas", tier: "EXPERT", level: 3 }, { user: "lea", tier: "HOLDER", level: 1 }],
  python: [{ user: "noah", tier: "EXPERT", level: 4 }, { user: "chloe", tier: "HOLDER", level: 2 }, { user: "camille", tier: "HOLDER", level: 1 }],
  ml: [{ user: "noah", tier: "HOLDER", level: 2 }],
  sql: [{ user: "noah", tier: "HOLDER", level: 2 }, { user: "hugo", tier: "HOLDER", level: 1 }],
  figma: [{ user: "emma", tier: "MASTER", level: 5 }, { user: "lea", tier: "HOLDER", level: 1 }],
  uiux: [{ user: "emma", tier: "EXPERT", level: 3 }, { user: "manon", tier: "HOLDER", level: 1 }],
  docker: [{ user: "jules", tier: "EXPERT", level: 3 }, { user: "chloe", tier: "HOLDER", level: 1 }],
  git: [{ user: "louis", tier: "HOLDER", level: 2 }, { user: "hugo", tier: "HOLDER", level: 2 }, { user: "jules", tier: "HOLDER", level: 1 }],
  comm: [{ user: "manon", tier: "HOLDER", level: 2 }, { user: "lea", tier: "HOLDER", level: 1 }],
};

const FEATURED: Record<string, { title: string; description: string; image: string }> = {
  react: {
    title: "React — de zéro à la prod",
    description: "Mon parcours React condensé en un atelier.\n\nOn part des composants et du JSX, on attaque les hooks (useState, useEffect, useMemo), puis la gestion d'état et le Context. On termine par les pièges de performance et le découpage de composants.\n\nFormat : 1h, en binôme, avec un mini-projet à coder ensemble.",
    image: "https://picsum.photos/seed/react-skill/1200/500",
  },
  figma: {
    title: "Figma — design system & prototypage",
    description: "Atelier orienté pratique.\n\nAuto-layout, composants et variants, puis construction d'un petit design system avec des tokens. On finit par un prototype cliquable.\n\nApporte une idée d'écran à maquetter !",
    image: "https://picsum.photos/seed/figma-skill/1200/500",
  },
};

async function ensureUsers(supabase: SupabaseClient): Promise<Record<string, string>> {
  // Map existing auth users by email so the seed is rerunnable.
  const existing = new Map<string, string>();
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 200) break;
    page++;
  }

  const ids: Record<string, string> = {};
  for (const u of USERS) {
    const email = `${u.key}@etu-digitalschool.paris`;
    let id = existing.get(email);
    if (!id) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: u.first, last_name: u.last },
      });
      if (error) throw new Error(`createUser ${email}: ${error.message}`);
      id = data.user.id;
      console.log(`  ✓ auth user créé : ${email}`);
    } else {
      console.log(`  • auth user existant : ${email}`);
    }
    ids[u.key] = id;
  }
  return ids;
}

async function clearAppData() {
  await prisma.notification.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.xpTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.tutoringSession.deleteMany();
  await prisma.skillPing.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY sont requis dans .env");
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log("→ Création des comptes Supabase…");
  const uid = await ensureUsers(supabase);

  console.log("→ Nettoyage des données applicatives…");
  await clearAppData();

  console.log("→ Promotion + profils…");
  const promo = await prisma.promotion.upsert({
    where: { slug: "b3-dev-2025-2026" },
    update: {},
    create: { name: "B3 Dev 2025-2026", slug: "b3-dev-2025-2026", startYear: 2025 },
  });

  for (const u of USERS) {
    const id = uid[u.key];
    const i = USERS.indexOf(u);
    // Plausible gamification values. Account XP accrues from EVERY action on the
    // platform (sessions, posts, messages, feedback…), so the account track is
    // always the most advanced — strictly higher than tutor/student levels.
    const tutorLevel = u.key === "lucas" || u.key === "emma" ? 4 : 1 + (i % 3);
    const studentLevel = 1 + ((i + 1) % 3);
    const accountLevel = Math.max(tutorLevel, studentLevel) + 2;
    await prisma.profile.upsert({
      where: { id },
      update: {},
      create: { id, email: `${u.key}@etu-digitalschool.paris` },
    });
    await prisma.profile.update({
      where: { id },
      data: {
        username: u.username,
        firstName: u.first,
        lastName: u.last,
        displayName: `${u.first} ${u.last}`,
        headline: u.headline,
        bio: u.bio,
        avatarUrl: `https://i.pravatar.cc/200?u=${u.username}`,
        promotionId: promo.id,
        githubUrl: `https://github.com/${u.username}`,
        isProfileComplete: true,
        onboardedAt: new Date(),
        accountLevel, accountXp: xpForLevel(accountLevel) + 30,
        tutorLevel, tutorXp: xpForLevel(tutorLevel) + 20,
        studentLevel, studentXp: xpForLevel(studentLevel) + 10,
        sessionsTaught: u.key === "lucas" ? 8 : u.key === "emma" ? 6 : 1,
        sessionsAttended: 2,
        sessionsCompleted: u.key === "lucas" ? 8 : 2,
        sessionsCancelled: u.key === "louis" ? 1 : 0,
        rankTier: tutorLevel >= 4 ? "Or" : "Argent",
        tutorRatingAvg: tutorLevel >= 4 ? 4.8 : 4.2,
        featuredOnLanding: u.key === "lucas" || u.key === "emma",
      },
    });
  }

  console.log("→ Catégories & compétences…");
  const catNames = [...new Set(SKILLS.map((s) => s.category))];
  const catId: Record<string, string> = {};
  for (const name of catNames) {
    const c = await prisma.skillCategory.create({ data: { name, slug: slugify(name) } });
    catId[name] = c.id;
  }

  const skillId: Record<string, string> = {};
  const skillSlug: Record<string, string> = {};
  for (const s of SKILLS) {
    const created = await prisma.skill.create({
      data: {
        name: s.name,
        slug: slugify(s.name),
        canonicalDescription: s.description,
        categoryId: catId[s.category],
        createdById: uid[s.createdBy],
        sessionCount: 0,
        heatScore: 10 + Math.round(Math.random() * 40),
        lastActivityAt: new Date(),
        notions: { create: s.notions.map((title, i) => ({ title, position: i })) },
      },
    });
    skillId[s.key] = created.id;
    skillSlug[s.key] = created.slug;
  }

  console.log("→ Compétences des étudiants (tiers) + certification…");
  // userSkillId keyed by `${skillKey}:${userKey}`
  const usId: Record<string, string> = {};
  for (const [sKey, holders] of Object.entries(HOLDERS)) {
    for (const h of holders) {
      const canTeach = h.tier !== "HOLDER" || true; // all active holders can teach (peer model)
      const us = await prisma.userSkill.create({
        data: {
          profileId: uid[h.user],
          skillId: skillId[sKey],
          tier: h.tier,
          level: h.level,
          xp: xpForLevel(h.level) + 20,
          canTeach,
          source: "SELF_ATTRIBUTED",
          status: "ACTIVE",
        },
      });
      usId[`${sKey}:${h.user}`] = us.id;
    }
  }

  // Certify skills whose designated expert is Expert+, point the featured version,
  // and add an expert rubric.
  for (const [sKey, expertKey] of Object.entries(EXPERTS)) {
    const expertUsId = usId[`${sKey}:${expertKey}`];
    if (!expertUsId) continue;

    const feat = FEATURED[sKey];
    if (feat) {
      await prisma.userSkill.update({
        where: { id: expertUsId },
        data: { customTitle: feat.title, customDescription: feat.description, customImageUrl: feat.image, source: "EVALUATION" },
      });
    }

    await prisma.skill.update({
      where: { id: skillId[sKey] },
      data: { isCertified: true, certifiedAt: new Date(), certifiedById: uid[expertKey], featuredUserSkillId: expertUsId },
    });

    const rubric = await prisma.rubric.create({
      data: {
        skillId: skillId[sKey],
        expertId: uid[expertKey],
        scale: "OUT_OF_20",
        passingScore: 12,
        criteria: { create: (SKILLS.find((s) => s.key === sKey)?.notions ?? []).map((label, i) => ({ label, position: i })) },
      },
    });
    void rubric;
  }

  console.log("→ Pings ouverts…");
  await prisma.skillPing.create({ data: { requesterId: uid.camille, skillId: skillId.react, message: "Je débute en React, j'aimerais de l'aide sur les hooks !", status: "OPEN" } });
  await prisma.skillPing.create({ data: { requesterId: uid.lea, skillId: skillId.node, message: "Quelqu'un pour m'expliquer les APIs Node ?", status: "OPEN" } });
  await prisma.skillPing.create({ data: { requesterId: uid.chloe, skillId: skillId.docker, status: "OPEN" } });

  console.log("→ Conversations & messages…");
  async function dm(aKey: string, bKey: string, msgs: { from: string; body: string }[]) {
    const conv = await prisma.conversation.create({
      data: {
        type: "DIRECT",
        participants: { create: [{ profileId: uid[aKey] }, { profileId: uid[bKey] }] },
      },
    });
    let last = new Date(Date.now() - msgs.length * 3_600_000);
    for (const m of msgs) {
      last = new Date(last.getTime() + 3_600_000);
      await prisma.message.create({ data: { conversationId: conv.id, senderId: uid[m.from], body: m.body, createdAt: last } });
    }
    await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: last } });
    return conv.id;
  }
  const convCamilleLucas = await dm("camille", "lucas", [
    { from: "camille", body: "Salut Lucas ! J'ai vu que tu es expert React 🙌" },
    { from: "lucas", body: "Salut Camille ! Oui avec plaisir, on peut caler une session." },
    { from: "camille", body: "Génial, je suis dispo cette semaine." },
  ]);
  await dm("lea", "emma", [
    { from: "lea", body: "Coucou Emma, tu donnes des cours de Figma ?" },
    { from: "emma", body: "Oui ! Tu veux voir l'auto-layout ?" },
  ]);
  await dm("noah", "chloe", [
    { from: "chloe", body: "Noah, dispo pour du Python ?" },
    { from: "noah", body: "Carrément, on fait un notebook ensemble." },
  ]);

  console.log("→ Sessions (planning de la semaine + historique) + reviews…");

  // Anchor all sessions to the current week's Monday so the planning view is
  // always populated whenever the seed runs. `at(dayOffset, hour)` — dayOffset 0
  // = Monday of this week, negatives = previous weeks, 7+ = following weeks.
  const monday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return d;
  })();
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  // Today's index within this week (0 = Mon) + a sensible hour for "in progress".
  const todayIdx = (() => { const day = new Date().getDay(); return day === 0 ? 6 : day - 1; })();
  const nowHour = Math.min(Math.max(new Date().getHours(), 9), 18);

  async function completedSession(opts: {
    tutor: string; student: string; skill: string; title: string; description: string;
    at: Date; duration: number; tutorRating: number; studentRating: number;
  }) {
    const s = await prisma.tutoringSession.create({
      data: {
        tutorId: uid[opts.tutor], skillId: skillId[opts.skill], kind: "TUTORING",
        title: opts.title, description: opts.description,
        scheduledAt: opts.at, durationMinutes: opts.duration, status: "COMPLETED",
        completedAt: new Date(opts.at.getTime() + opts.duration * 60_000),
        participants: { create: [{ studentId: uid[opts.student], status: "APPROVED", attended: true }] },
      },
    });
    await prisma.review.create({ data: { sessionId: s.id, reviewerId: uid[opts.student], revieweeId: uid[opts.tutor], direction: "STUDENT_TO_TUTOR", rating: opts.tutorRating, comment: "Session très utile, merci !" } });
    await prisma.review.create({ data: { sessionId: s.id, reviewerId: uid[opts.tutor], revieweeId: uid[opts.student], direction: "TUTOR_TO_STUDENT", rating: opts.studentRating, comment: "Bonne progression, continue !" } });
    return s;
  }

  // ── History (past weeks) ──────────────────────────────────────────────
  await completedSession({ tutor: "lucas", student: "hugo", skill: "react", title: "Les hooks React en pratique", description: "Atelier hooks + state.", at: at(-13, 10), duration: 60, tutorRating: 5, studentRating: 5 });
  await completedSession({ tutor: "lucas", student: "lea", skill: "react", title: "React : composants & props", description: "Bases des composants.", at: at(-12, 14), duration: 60, tutorRating: 5, studentRating: 4 });
  await completedSession({ tutor: "emma", student: "lea", skill: "figma", title: "Figma : auto-layout", description: "Composants et variants.", at: at(-9, 15), duration: 90, tutorRating: 5, studentRating: 5 });
  await completedSession({ tutor: "noah", student: "chloe", skill: "python", title: "Python : les bases", description: "Variables, boucles, fonctions.", at: at(-8, 11), duration: 60, tutorRating: 4, studentRating: 5 });

  // CANCELLED (Git) — last week.
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.louis, skillId: skillId.git, kind: "TUTORING",
      title: "Git rebase sans stress", description: "Rebase interactif.",
      scheduledAt: at(-10, 16), durationMinutes: 45, status: "CANCELLED",
      cancelledAt: at(-11, 9), cancelledById: uid.camille,
      participants: { create: [{ studentId: uid.camille, status: "CANCELLED" }] },
    },
  });

  // EVALUATION (React, certifiée) — Lucas évalue Camille, réussie (la semaine dernière).
  const reactRubric = await prisma.rubric.findFirst({ where: { skillId: skillId.react, expertId: uid.lucas } });
  const sEval = await prisma.tutoringSession.create({
    data: {
      tutorId: uid.lucas, skillId: skillId.react, kind: "EVALUATION",
      title: "Évaluation React", description: "Validation des notions pour certification.",
      scheduledAt: at(-4, 14), durationMinutes: 45, status: "COMPLETED",
      completedAt: at(-4, 15),
      conversationId: convCamilleLucas, rubricId: reactRubric?.id ?? null,
      participants: { create: [{ studentId: uid.camille, status: "APPROVED", attended: true }] },
    },
  });

  // ── This week (planning) ──────────────────────────────────────────────
  // Lucas (hero account) is busy: Mon, Wed and Fri.
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.lucas, skillId: skillId.react, kind: "TUTORING",
      title: "React avancé : performance", description: "memo, useMemo, profiling.",
      scheduledAt: at(0, 10), durationMinutes: 60, status: "CONFIRMED",
      participants: { create: [{ studentId: uid.hugo, status: "APPROVED" }] },
    },
  });
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.hugo, skillId: skillId.node, kind: "TUTORING",
      title: "Construire une API REST", description: "Express, routes, middlewares.",
      scheduledAt: at(1, 14), durationMinutes: 60, status: "CONFIRMED",
      participants: { create: [{ studentId: uid.noah, status: "APPROVED" }] },
    },
  });
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.lucas, skillId: skillId.next, kind: "TUTORING",
      title: "Next.js : App Router", description: "RSC, server actions, caching.",
      scheduledAt: at(2, 16), durationMinutes: 90, status: "CONFIRMED",
      participants: { create: [{ studentId: uid.lea, status: "APPROVED" }] },
    },
  });
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.jules, skillId: skillId.docker, kind: "TUTORING",
      title: "Docker pour les devs", description: "Images, Compose, volumes.",
      scheduledAt: at(3, 11), durationMinutes: 60, status: "PROPOSED",
      participants: { create: [{ studentId: uid.manon, status: "PENDING" }] },
    },
  });
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.emma, skillId: skillId.figma, kind: "TUTORING",
      title: "Figma : prototypage", description: "Interactions et transitions.",
      scheduledAt: at(4, 15), durationMinutes: 90, status: "CONFIRMED",
      participants: { create: [{ studentId: uid.lea, status: "APPROVED" }] },
    },
  });
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.lucas, skillId: skillId.react, kind: "TUTORING",
      title: "React : revue de code", description: "Bonnes pratiques et refactoring.",
      scheduledAt: at(4, 17), durationMinutes: 60, status: "CONFIRMED",
      participants: { create: [{ studentId: uid.camille, status: "APPROVED" }] },
    },
  });
  // IN_PROGRESS right now (today) so the planning shows a live block.
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.noah, skillId: skillId.python, kind: "TUTORING",
      title: "Python : structures de données", description: "Listes, dicts, sets.",
      scheduledAt: at(todayIdx, nowHour), durationMinutes: 90, status: "IN_PROGRESS",
      participants: { create: [{ studentId: uid.chloe, status: "APPROVED" }] },
    },
  });

  // ── Next week (future proposals) ──────────────────────────────────────
  await prisma.tutoringSession.create({
    data: {
      tutorId: uid.lucas, skillId: skillId.react, kind: "TUTORING",
      title: "React : formulaires & validation", description: "Controlled inputs, erreurs.",
      scheduledAt: at(7, 10), durationMinutes: 60, status: "PROPOSED",
      participants: { create: [{ studentId: uid.lea, status: "PENDING" }] },
    },
  });
  const evalReview = await prisma.review.create({
    data: {
      sessionId: sEval.id, reviewerId: uid.lucas, revieweeId: uid.camille,
      direction: "TUTOR_TO_STUDENT", rating: 4, comment: "Bonne maîtrise, compétence acquise.",
      score: 15, passed: true, rubricId: reactRubric?.id ?? null,
    },
  });
  if (reactRubric) {
    const crits = await prisma.rubricCriterion.findMany({ where: { rubricId: reactRubric.id } });
    for (const c of crits) {
      await prisma.notionValidation.create({ data: { reviewId: evalReview.id, rubricCriterionId: c.id, label: c.label, acquired: true } });
    }
  }
  // Camille obtient React (certifiée) via évaluation, avec droit d'enseigner.
  await prisma.userSkill.upsert({
    where: { profileId_skillId: { profileId: uid.camille, skillId: skillId.react } },
    update: { status: "ACTIVE", source: "EVALUATION", canTeach: true },
    create: { profileId: uid.camille, skillId: skillId.react, source: "EVALUATION", status: "ACTIVE", canTeach: true },
  });

  console.log("→ Fil d'actualité (posts, likes, commentaires)…");
  const posts: { author: string; kind: "GENERAL" | "TUTORING_OFFER" | "ANNOUNCEMENT"; content: string; skill?: string }[] = [
    { author: "lucas", kind: "ANNOUNCEMENT", content: "🚀 J'organise un atelier React avancé jeudi pour ceux qui veulent passer un cap sur les hooks et la perf. Pingez-moi !", skill: "react" },
    { author: "emma", kind: "TUTORING_OFFER", content: "Je propose des sessions Figma cette semaine : design system, prototypage, auto-layout. Débutants bienvenus 🎨", skill: "figma" },
    { author: "noah", kind: "GENERAL", content: "Petit thread sur l'overfitting en ML : comment le repérer et l'éviter. 🧵" },
    { author: "hugo", kind: "GENERAL", content: "Je viens de finir une API Node propre avec des tests. Fier du résultat 💪" },
    { author: "manon", kind: "ANNOUNCEMENT", content: "Atelier prise de parole en public vendredi midi. Venez pitcher vos projets !" },
    { author: "lea", kind: "GENERAL", content: "Première session de React aujourd'hui, j'ai adoré. Merci à la communauté du campus 🙏" },
  ];
  const postRows: { id: string; author: string }[] = [];
  for (const p of posts) {
    const row = await prisma.post.create({
      data: { authorId: uid[p.author], kind: p.kind, content: p.content, skillId: p.skill ? skillId[p.skill] : null },
    });
    postRows.push({ id: row.id, author: p.author });
  }
  // Likes & comments.
  const likers = ["lea", "chloe", "camille", "hugo", "noah", "jules", "manon", "louis"];
  for (const pr of postRows) {
    const chosen = likers.filter((k) => k !== pr.author).slice(0, 3 + (postRows.indexOf(pr) % 4));
    for (const k of chosen) {
      await prisma.postLike.create({ data: { postId: pr.id, profileId: uid[k] } });
    }
    await prisma.post.update({ where: { id: pr.id }, data: { likeCount: chosen.length } });
  }
  await prisma.comment.create({ data: { postId: postRows[0].id, authorId: uid.lea, body: "Je m'inscris ! 🙋" } });
  await prisma.comment.create({ data: { postId: postRows[0].id, authorId: uid.camille, body: "Trop hâte." } });
  await prisma.comment.create({ data: { postId: postRows[1].id, authorId: uid.manon, body: "Figma <3" } });
  await prisma.post.update({ where: { id: postRows[0].id }, data: { commentCount: 2 } });
  await prisma.post.update({ where: { id: postRows[1].id }, data: { commentCount: 1 } });

  console.log("→ Notifications…");
  await prisma.notification.create({ data: { recipientId: uid.lucas, type: "PING_RECEIVED", actorId: uid.camille, entityType: "skill", entityId: skillId.react, data: { skillName: "React", requesterName: "Camille Roux", message: "Je débute en React" } } });
  await prisma.notification.create({ data: { recipientId: uid.manon, type: "SESSION_PROPOSED", actorId: uid.jules, entityType: "session", entityId: sEval.id, data: { title: "Docker pour les devs", skillName: "Docker" } } });
  await prisma.notification.create({ data: { recipientId: uid.lea, type: "FEEDBACK_REQUEST", entityType: "session", entityId: sEval.id, data: { title: "Initiation Figma : auto-layout", role: "student" } } });
  await prisma.notification.create({ data: { recipientId: uid.lucas, type: "POST_LIKED", actorId: uid.lea, entityType: "post", entityId: postRows[0].id } });
  await prisma.notification.create({ data: { recipientId: uid.camille, type: "EVALUATION_RESULT", actorId: uid.lucas, entityType: "session", entityId: sEval.id, data: { passed: true, score: 15 } } });

  // Refresh skill session counts for realism.
  for (const sKey of Object.keys(skillId)) {
    const count = await prisma.tutoringSession.count({ where: { skillId: skillId[sKey] } });
    await prisma.skill.update({ where: { id: skillId[sKey] }, data: { sessionCount: count } });
  }

  console.log("\n✅ Seed terminé.");
  console.log(`   ${USERS.length} étudiants · ${SKILLS.length} compétences · sessions/posts/chats créés.`);
  console.log(`   Connexion : <prenom>@etu-digitalschool.paris  /  ${PASSWORD}`);
  console.log("   Ex : lucas@etu-digitalschool.paris, emma@etu-digitalschool.paris, camille@etu-digitalschool.paris");
}

main()
  .catch((e) => {
    console.error("❌ Seed échoué :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
