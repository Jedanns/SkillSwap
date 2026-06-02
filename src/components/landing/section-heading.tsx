import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  kicker?: string;
  align?: "left" | "center";
  className?: string;
};

/**
 * Shared section header: a mono eyebrow label, an oversized display title,
 * and an optional supporting kicker line.
 */
export function SectionHeading({
  eyebrow,
  title,
  kicker,
  align = "left",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-ink">
        <span aria-hidden className="text-peach">
          ✳
        </span>
        {eyebrow}
      </span>
      <h2
        className={cn(
          "max-w-2xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink",
          centered && "mx-auto",
        )}
      >
        {title}
      </h2>
      {kicker ? (
        <p
          className={cn(
            "max-w-xl text-base leading-relaxed text-muted-ink sm:text-lg",
            centered && "mx-auto",
          )}
        >
          {kicker}
        </p>
      ) : null}
    </Reveal>
  );
}
