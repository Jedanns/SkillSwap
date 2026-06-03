import type { UserSkill, CatalogSkill } from "./types";

export const MOCK_USER_SKILLS: UserSkill[] = [
  {
    id: "us1",
    tier: "EXPERT",
    level: 7,
    xp: 1420,
    canTeach: true,
    skill: {
      id: "sk1",
      name: "React",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 48, sessions: 23 },
    },
  },
  {
    id: "us2",
    tier: "HOLDER",
    level: 2,
    xp: 280,
    canTeach: false,
    skill: {
      id: "sk2",
      name: "Node.js",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 35, sessions: 17 },
    },
  },
  {
    id: "us3",
    tier: "MASTER",
    level: 12,
    xp: 4200,
    canTeach: true,
    skill: {
      id: "sk3",
      name: "TypeScript",
      category: { id: "c1", name: "Développement web" },
      _count: { holders: 61, sessions: 44 },
    },
  },
  {
    id: "us4",
    tier: "HOLDER",
    level: 1,
    xp: 80,
    canTeach: false,
    skill: {
      id: "sk4",
      name: "Figma",
      category: { id: "c2", name: "Design" },
      _count: { holders: 29, sessions: 8 },
    },
  },
  {
    id: "us5",
    tier: "EXPERT",
    level: 5,
    xp: 870,
    canTeach: true,
    skill: {
      id: "sk5",
      name: "PostgreSQL",
      category: { id: "c3", name: "Base de données" },
      _count: { holders: 22, sessions: 11 },
    },
  },
];

export const MOCK_CATALOG: CatalogSkill[] = [
  { id: "sk6",  name: "Vue.js",           category: { id: "c1", name: "Développement web" }, _count: { holders: 31 } },
  { id: "sk7",  name: "Python",           category: { id: "c4", name: "Programmation" },     _count: { holders: 74 } },
  { id: "sk8",  name: "Docker",           category: { id: "c5", name: "DevOps" },            _count: { holders: 19 } },
  { id: "sk9",  name: "Tailwind CSS",     category: { id: "c1", name: "Développement web" }, _count: { holders: 42 } },
  { id: "sk10", name: "GraphQL",          category: { id: "c1", name: "Développement web" }, _count: { holders: 16 } },
  { id: "sk11", name: "Machine Learning", category: { id: "c4", name: "Programmation" },     _count: { holders: 11 } },
  { id: "sk12", name: "Kubernetes",       category: { id: "c5", name: "DevOps" },            _count: { holders: 8  } },
  { id: "sk13", name: "UX Research",      category: { id: "c2", name: "Design" },            _count: { holders: 14 } },
  { id: "sk14", name: "Swift",            category: { id: "c4", name: "Programmation" },     _count: { holders: 9  } },
  { id: "sk15", name: "MongoDB",          category: { id: "c3", name: "Base de données" },   _count: { holders: 27 } },
];
