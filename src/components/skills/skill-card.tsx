"use client";

import { Eye, GraduationCap, Layers, Star } from "lucide-react";
import { TierBadge } from "./tier-badge";
import { XpBar } from "./xp-bar";
import { XP_CAPS } from "./tier-config";
import type { UserSkill } from "./types";

interface SkillCardProps {
  userSkill: UserSkill;
  onView: () => void;
}

export function SkillCard({ userSkill: us, onView }: SkillCardProps) {
  const nextXp = XP_CAPS[us.tier];

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-5 transition-shadow hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-ink">{us.skill.category.name}</p>
          <h3 className="mt-0.5 truncate font-heading text-lg font-bold text-ink">
            {us.skill.name}
          </h3>
        </div>
        <TierBadge tier={us.tier} />
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-ink">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          Niv.&nbsp;{us.level}
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />
          {us.xp}&nbsp;XP
        </span>
        {us.skill._count && (
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            {us.skill._count.sessions}&nbsp;séances
          </span>
        )}
        {us.canTeach && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-pistache/30 px-2 py-0.5 font-semibold text-deep-green">
            Tuteur
          </span>
        )}
      </div>

      {/* XP bar */}
      <XpBar xp={us.xp} tier={us.tier} showLabel />

      {/* Action */}
      <button
        onClick={onView}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas py-2 text-sm font-semibold text-ink transition-colors hover:border-powder hover:bg-powder/20"
      >
        <Eye className="h-4 w-4 text-muted-ink" />
        Voir les détails
      </button>
    </article>
  );
}
