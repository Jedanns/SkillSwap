import { BookOpen, Star, Award } from "lucide-react";
import type { Tier } from "./types";

export const TIER_CONFIG: Record<
  Tier,
  {
    label: string;
    color: string;
    bg: string;
    barColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  HOLDER: {
    label: "Holder",
    color: "text-muted-ink",
    bg: "bg-[#f0f0ee]",
    barColor: "bg-muted-ink/40",
    icon: BookOpen,
  },
  EXPERT: {
    label: "Expert",
    color: "text-[#1a6b9c]",
    bg: "bg-powder/40",
    barColor: "bg-powder",
    icon: Star,
  },
  MASTER: {
    label: "Master",
    color: "text-deep-green",
    bg: "bg-pistache/40",
    barColor: "bg-pistache",
    icon: Award,
  },
};

export const XP_CAPS: Record<Tier, number> = {
  HOLDER: 500,
  EXPERT: 2000,
  MASTER: 10000,
};
