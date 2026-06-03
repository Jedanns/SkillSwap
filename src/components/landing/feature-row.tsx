import Image from "next/image";

import { cn } from "@/lib/utils";

import { ICONS } from "./icons";
import { Reveal } from "./reveal";

type FeatureRowProps = {
  side: string;
  accent: string;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  image?: string;
  alt?: string;
};

// Pastel fill for the visual panel that sits opposite the text.
const PANEL: Record<string, string> = {
  powder: "bg-powder",
  pistache: "bg-pistache",
  peach: "bg-peach/25",
  "deep-green": "bg-deep-green",
};

const CHIP: Record<string, string> = {
  powder: "bg-surface text-deep-green",
  pistache: "bg-deep-green text-pistache",
  peach: "bg-surface text-peach",
  "deep-green": "bg-pistache text-deep-green",
};

export function FeatureRow({
  side,
  accent,
  icon,
  eyebrow,
  title,
  body,
  image,
  alt,
}: FeatureRowProps) {
  const Icon = ICONS[icon];
  const textRight = side === "right";

  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
      {/* Text block — first on mobile for reading flow, alternates on desktop */}
      <Reveal className={cn("order-1", textRight ? "md:order-2" : "md:order-1")}>
        <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.16em] text-muted-ink">
          <span aria-hidden className="text-peach">
            ✳
          </span>
          {eyebrow}
        </span>
        <h3 className="mt-4 max-w-md text-balance font-heading text-[clamp(1.6rem,3.5vw,2.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-ink sm:text-lg">
          {body}
        </p>
      </Reveal>

      {/* Visual panel — real photo with a floating brand-accent icon badge.
         Falls back to a pastel icon panel when no image is provided. */}
      <Reveal
        delay={80}
        className={cn("order-2", textRight ? "md:order-1" : "md:order-2")}
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-[36px] border border-hairline",
            image ? "bg-canvas" : PANEL[accent] ?? "bg-canvas",
          )}
        >
          {image ? (
            <>
              <Image
                src={image}
                alt={alt ?? ""}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Floating brand badge anchored to a corner */}
              <span
                className={cn(
                  "absolute bottom-4 left-4 flex size-12 rotate-[-6deg] items-center justify-center rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.22)]",
                  CHIP[accent] ?? "bg-surface text-ink",
                )}
              >
                {Icon ? <Icon className="size-6" /> : null}
              </span>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {/* dot-grid texture */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <span
                className={cn(
                  "relative flex size-20 rotate-[-6deg] items-center justify-center rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
                  CHIP[accent] ?? "bg-surface text-ink",
                )}
              >
                {Icon ? <Icon className="size-9" /> : null}
              </span>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
