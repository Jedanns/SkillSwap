"use client";

import { GraduationCap, Layers, TrendingUp, X } from "lucide-react";
import { TierBadge } from "./tier-badge";
import { TIER_CONFIG, XP_CAPS } from "./tier-config";
import type { UserSkill } from "./types";

interface SkillDetailModalProps {
  userSkill: UserSkill;
  onClose: () => void;
}

export function SkillDetailModal({ userSkill: us, onClose }: SkillDetailModalProps) {
  const { barColor } = TIER_CONFIG[us.tier];
  const nextXp = XP_CAPS[us.tier];
  const pct = Math.min((us.xp / nextXp) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        {/* Colored top band */}
        <div className={`h-1.5 w-full ${barColor}`} />

        <div className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-ink">{us.skill.category.name}</p>
              <h2 className="mt-0.5 font-heading text-2xl font-black text-ink">{us.skill.name}</h2>
              <div className="mt-2">
                <TierBadge tier={us.tier} size="md" />
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline transition-colors hover:bg-canvas"
            >
              <X className="h-4 w-4 text-muted-ink" />
            </button>
          </div>

          {/* XP section */}
          <div className="rounded-xl border border-hairline bg-canvas p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Progression</span>
              <span className="text-xs text-muted-ink">
                {us.xp} / {nextXp} XP
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-ink">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                Niveau {us.level}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {pct.toFixed(0)}% vers le palier suivant
              </span>
            </div>
          </div>

          {/* Stats grid */}
          {us.skill._count && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-hairline bg-canvas p-3">
                <p className="text-xs text-muted-ink">Détenteurs</p>
                <p className="mt-0.5 text-xl font-bold text-ink">{us.skill._count.holders}</p>
              </div>
              <div className="rounded-xl border border-hairline bg-canvas p-3">
                <p className="text-xs text-muted-ink">Séances de tutorat</p>
                <p className="mt-0.5 text-xl font-bold text-ink">{us.skill._count.sessions}</p>
              </div>
            </div>
          )}

          {/* canTeach */}
          {us.canTeach && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-pistache/40 bg-pistache/10 p-3">
              <GraduationCap className="h-5 w-5 shrink-0 text-deep-green" />
              <div>
                <p className="text-sm font-semibold text-deep-green">
                  Vous pouvez enseigner cette compétence
                </p>
                <p className="text-xs text-muted-ink">
                  Vous apparaissez dans les résultats de recherche de tuteurs.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-hairline bg-surface py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
