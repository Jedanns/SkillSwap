import { TIER_CONFIG } from "./tier-config";
import type { Tier } from "./types";

interface TierBadgeProps {
  tier: Tier;
  size?: "sm" | "md";
}

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${cfg.bg} ${cfg.color}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {cfg.label}
    </span>
  );
}
