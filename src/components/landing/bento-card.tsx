import { cn } from "@/lib/utils";

import { ICONS } from "./icons";
import { Reveal } from "./reveal";

type BentoCardProps = {
  span: string;
  accent: string;
  icon: string;
  title: string;
  body: string;
  index: number;
};

const SPAN_CLASS: Record<string, string> = {
  wide: "sm:col-span-2 md:col-span-2",
  tall: "md:row-span-2",
  full: "sm:col-span-2 md:col-span-3",
  default: "",
};

// Per-accent treatment: pistache/deep-green are full-bleed pastel "blocks";
// powder/peach/surface stay white with a coloured icon chip (used sparingly).
const ACCENT: Record<
  string,
  { card: string; chip: string; title: string; body: string }
> = {
  pistache: {
    card: "bg-pistache border-transparent",
    chip: "bg-deep-green text-pistache",
    title: "text-deep-green",
    body: "text-deep-green/80",
  },
  "deep-green": {
    card: "bg-deep-green border-transparent",
    chip: "bg-pistache text-deep-green",
    title: "text-surface",
    body: "text-surface/75",
  },
  powder: {
    card: "bg-surface border-hairline",
    chip: "bg-powder text-deep-green",
    title: "text-ink",
    body: "text-muted-ink",
  },
  peach: {
    card: "bg-surface border-hairline",
    chip: "bg-peach/20 text-peach",
    title: "text-ink",
    body: "text-muted-ink",
  },
  surface: {
    card: "bg-surface border-hairline",
    chip: "bg-canvas text-ink",
    title: "text-ink",
    body: "text-muted-ink",
  },
};

export function BentoCard({
  span,
  accent,
  icon,
  title,
  body,
  index,
}: BentoCardProps) {
  const Icon = ICONS[icon];
  const tone = ACCENT[accent] ?? ACCENT.surface;
  const isBanner = span === "full";

  return (
    <Reveal
      as="article"
      delay={index * 60}
      className={cn(
        "group flex flex-col rounded-[28px] border p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_16px_44px_rgba(0,0,0,0.08)] sm:p-7",
        SPAN_CLASS[span] ?? "",
        tone.card,
        isBanner && "md:flex-row md:items-center md:gap-8",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
          tone.chip,
        )}
      >
        {Icon ? <Icon className="size-5" /> : null}
      </span>
      <div className={cn(isBanner ? "mt-0" : "mt-5")}>
        <h3
          className={cn(
            "font-heading text-xl font-bold leading-tight tracking-[-0.02em]",
            tone.title,
          )}
        >
          {title}
        </h3>
        <p className={cn("mt-2 text-sm leading-relaxed sm:text-base", tone.body)}>
          {body}
        </p>
      </div>
    </Reveal>
  );
}
