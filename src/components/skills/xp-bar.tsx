import { TIER_CONFIG, XP_CAPS } from "./tier-config";
import type { Tier } from "./types";

interface XpBarProps {
  xp: number;
  tier: Tier;
  /** Show the XP label below the bar. Default false. */
  showLabel?: boolean;
}

export function XpBar({ xp, tier, showLabel = false }: XpBarProps) {
  const cap = XP_CAPS[tier];
  const pct = Math.min((xp / cap) * 100, 100);
  const { barColor } = TIER_CONFIG[tier];

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-muted-ink">
          {xp} / {cap} XP
        </p>
      )}
    </div>
  );
}
