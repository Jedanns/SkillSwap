export type Tier = "HOLDER" | "EXPERT" | "MASTER";

export interface Skill {
  id: string;
  name: string;
  category: { id: string; name: string };
}

export interface UserSkill {
  id: string;
  tier: Tier;
  level: number;
  xp: number;
  canTeach: boolean;
  skill: Skill & { _count?: { holders: number; sessions: number } };
}

export interface CatalogSkill {
  id: string;
  name: string;
  category: { id: string; name: string };
  _count: { holders: number };
}
