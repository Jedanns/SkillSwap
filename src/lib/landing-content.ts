/**
 * Centralised copy & data for the SkillSwap landing page.
 * Keeping all FR strings here lets the section components stay purely
 * presentational. Content is derived from the product spec and the Prisma
 * domain (skills, tiers, pings, sessions, reviews, promotions).
 *
 * `icon` fields are lucide-react icon names, resolved in the components.
 */

export const SCHOOL_DOMAIN = "@etu-digitalschool.paris";

export const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Compétences", href: "#competences" },
  { label: "Progression", href: "#progression" },
  { label: "Témoignages", href: "#temoignages" },
] as const;

export const HERO = {
  title: ["Apprends. Enseigne.", "Progresse, entre", "étudiants."],
  subtitle:
    "SkillSwap met en relation les étudiants du campus pour du tutorat entre pairs — du code au design, de la cuisine à la gestion de projet. Trouve un tuteur, partage tes compétences et fais certifier ton niveau.",
  primaryCta: { label: "Créer mon compte étudiant", href: "/signup" },
  secondaryCta: { label: "Découvrir la plateforme", href: "#fonctionnalites" },
  // Floating UI widgets used as decorative proof points around the headline.
  widgets: {
    certified: {
      tag: "Compétence certifiée",
      skill: "React",
      rating: "4.9",
      experts: "3 experts",
    },
    session: {
      tag: "Session confirmée",
      title: "Hooks & state management",
      when: "Demain · 18h00",
      duration: "1h30",
    },
    xp: {
      tag: "Niveau tuteur",
      level: "Expert",
      value: "+120 XP cette semaine",
    },
  },
} as const;

/** Bento grid — mixed sizes; `span` maps to Tailwind col/row classes in the card. */
export const BENTO_CARDS = [
  {
    id: "search",
    span: "wide", // 2x1
    accent: "powder",
    icon: "Search",
    title: "Recherche centralisée intelligente",
    body: "Une seule barre interroge compétences, étudiants, sessions et actualités. Tape « React », « Figma » ou « gestion de projet » et retrouve la fiche, les tuteurs et les sessions ouvertes.",
  },
  {
    id: "feed",
    span: "tall", // 1x2
    accent: "pistache",
    icon: "Newspaper",
    title: "Fil d’actualités",
    body: "Un réseau interne au campus : publie une réflexion, annonce un atelier, like et commente. Et lance une conversation en un clic.",
  },
  {
    id: "chat",
    span: "default", // 1x1
    accent: "surface",
    icon: "MessagesSquare",
    title: "Chat & sessions",
    body: "Discute, puis transforme l’échange en session formelle : description, date, durée.",
  },
  {
    id: "ping",
    span: "default", // 1x1
    accent: "peach",
    icon: "BellRing",
    title: "Ping de compétence",
    body: "Signale que tu cherches un tuteur. Les experts de la compétence sont notifiés.",
  },
  {
    id: "planning",
    span: "full", // full-width banner row
    accent: "deep-green",
    icon: "CalendarCheck",
    title: "Planning automatique",
    body: "Une session approuvée atterrit dans les deux plannings, passe en « terminée » à l’heure prévue, puis déclenche les feedbacks.",
  },
] as const;

/** Alternating feature rows. `side` controls text-left vs text-right. */
export const FEATURE_ROWS = [
  {
    id: "match",
    side: "left",
    accent: "powder",
    icon: "Users",
    image: "/First.png",
    alt: "Deux étudiants du campus collaborent autour d’un ordinateur portable.",
    eyebrow: "Mise en relation",
    title: "Le bon tuteur, au bon moment",
    body: "Depuis une fiche de compétence, ouvre une conversation avec un tuteur ou lance un ping public. Les étudiants qui maîtrisent le sujet reçoivent l’alerte.",
  },
  {
    id: "sessions",
    side: "right",
    accent: "pistache",
    icon: "CalendarCheck",
    image: "/Second.png",
    alt: "Un étudiant organise son planning de sessions sur une tablette et un agenda.",
    eyebrow: "Sessions validées",
    title: "Des sessions cadrées, pas des promesses",
    body: "Le tuteur propose une session, l’élève approuve, et tout passe automatiquement dans les plannings. Publique ou privée, chacun confirme sa place.",
  },
  {
    id: "feedback",
    side: "left",
    accent: "peach",
    icon: "Star",
    image: "/Third.png",
    alt: "Un étudiant satisfait après une session de tutorat réussie.",
    eyebrow: "Feedback 5 étoiles",
    title: "La réputation se gagne en cours",
    body: "Après chaque session, élève et tuteur s’évaluent sur 5 étoiles. Les notions abordées peuvent être cochées une à une pour valider l’acquisition.",
  },
  {
    id: "certified",
    side: "right",
    accent: "deep-green",
    icon: "BadgeCheck",
    image: "/Fourth.png",
    alt: "Un étudiant expert valide le travail d’un autre étudiant sur le campus.",
    eyebrow: "Compétences certifiées",
    title: "Une crédibilité vérifiée par les experts",
    body: "Au niveau Expert, une compétence devient certifiée : elle ne s’auto-attribue plus. Pour l’obtenir, passe une évaluation auprès d’un expert du campus.",
  },
] as const;

export const SKILLS_MARQUEE = [
  "React",
  "UI/UX Design",
  "Cuisine",
  "Gestion de projet",
  "Figma",
  "Python",
  "Photographie",
  "Diagramme de Gantt",
  "Montage vidéo",
  "Anglais",
  "Marketing",
  "Excel & tableurs",
  "Prise de parole",
  "Cybersécurité",
] as const;

export const TESTIMONIALS = [
  {
    name: "Inès Moreau",
    role: "B3 Dev · Experte React",
    quote:
      "J’ai trouvé un tuteur en TypeScript le jour même. Deux sessions plus tard, je tutorais déjà à mon tour.",
    rating: 5,
    initials: "IM",
    accent: "pistache",
  },
  {
    name: "Karim Benali",
    role: "B2 · Tuteur Gestion de projet",
    quote:
      "J’aide d’autres étudiants à monter leur rétroplanning et leurs diagrammes de Gantt. Mes feedbacks m’ont fait passer Expert.",
    rating: 5,
    initials: "KB",
    accent: "powder",
  },
  {
    name: "Lina Hadj",
    role: "B1 Design · Élève",
    quote:
      "Le ping de compétence est génial : je signale que je cherche de l’aide en Figma et les experts viennent à moi.",
    rating: 5,
    initials: "LH",
    accent: "peach",
  },
  {
    name: "Théo Garnier",
    role: "B3 · Maître Cuisine",
    quote:
      "Les compétences ne sont pas que techniques : j’anime des sessions cuisine certifiées et c’est complet à chaque fois.",
    rating: 5,
    initials: "TG",
    accent: "deep-green",
  },
] as const;

/** Three gamification axes (replaces the spec's pricing intro). */
export const PROGRESSION_TRACKS = [
  {
    icon: "Activity",
    title: "Niveau de compte",
    body: "Chaque action sur la plateforme fait progresser ton compte : posts, messages, sessions.",
  },
  {
    icon: "GraduationCap",
    title: "Niveau de tuteur",
    body: "Les feedbacks positifs de tes élèves augmentent ton niveau de tuteur, compétence par compétence.",
  },
  {
    icon: "Sparkles",
    title: "Niveau d’élève",
    body: "Les retours de tes tuteurs nourrissent ta progression d’élève et débloquent de nouvelles compétences.",
  },
] as const;

/** Skill tiers (Prisma SkillTier: HOLDER → EXPERT → MASTER). No prices: free, campus-only. */
export const PROGRESSION_TIERS = [
  {
    id: "membre",
    name: "Membre",
    level: "Niveau 1",
    tagline: "Tu t’attribues une compétence et tu démarres.",
    highlighted: false,
    features: [
      "Création et attribution de compétences",
      "Recherche, chat et fil d’actualités",
      "Ping de tutorat sur tes besoins",
      "Sessions privées avec tes tuteurs",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    level: "Niveau 3",
    tagline: "Ta compétence devient certifiée et passe en avant.",
    highlighted: true,
    features: [
      "Compétence certifiée, mise en avant partout",
      "Référentiel d’évaluation (notions, barème)",
      "Tu valides l’acquisition des nouveaux élèves",
      "Sessions publiques avec plusieurs élèves",
    ],
  },
  {
    id: "maitre",
    name: "Maître",
    level: "Niveau 5",
    tagline: "La référence du campus sur ta compétence.",
    highlighted: false,
    features: [
      "Statut Maître, priorité maximale en recherche",
      "Ta version de la fiche s’affiche par défaut",
      "Évaluations officielles et certification",
      "Mentorat des futurs tuteurs",
    ],
  },
] as const;

export const FINAL_CTA = {
  eyebrow: "Prêt à commencer ?",
  title: "Ton campus a déjà les meilleurs profs : tes camarades.",
  body: `Crée ton compte avec ton adresse ${SCHOOL_DOMAIN} et rejoins la communauté SkillSwap.`,
  primaryCta: { label: "Créer mon compte", href: "/signup" },
  secondaryCta: { label: "Se connecter", href: "/login" },
} as const;

export const FOOTER_GROUPS = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#fonctionnalites" },
      { label: "Compétences", href: "#competences" },
      { label: "Progression", href: "#progression" },
      { label: "Actualités", href: "#temoignages" },
    ],
  },
  {
    title: "Campus",
    links: [
      { label: "DSP F2I", href: "#" },
      { label: "Devenir tuteur", href: "/signup" },
      { label: "Compétences certifiées", href: "#progression" },
      { label: "Promotions", href: "#temoignages" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Guide de démarrage", href: "#" },
      { label: "Centre d’aide", href: "#" },
      { label: "Règles de la communauté", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "#" },
      { label: "Confidentialité", href: "#" },
      { label: "Conditions d’utilisation", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
] as const;
