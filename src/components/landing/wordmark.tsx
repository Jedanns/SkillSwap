import Image from "next/image";

import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** Kept for API compatibility; the logo is a fixed-color image. */
  tone?: "ink" | "surface";
};

/**
 * SkillSwap brand wordmark — the official logo (s-2.svg).
 *
 * The source artwork is a 16:9 frame with a solid white background and the
 * mark centred inside it (content bounds ≈ x:370–1046, y:81–722 of the
 * 1440×810 canvas). We crop to that centre square with `object-cover` and
 * present it on a rounded white tile, so it reads as an intentional logo on
 * both the light navbar and the dark footer. Size it via `className` height
 * (defaults to h-9); the tile stays square.
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={cn(
        "relative inline-block aspect-square h-9 overflow-hidden rounded-xl bg-surface",
        className,
      )}
    >
      <Image
        src="/s-2.svg"
        alt="SkillSwap"
        fill
        priority
        sizes="44px"
        className="object-cover"
      />
    </span>
  );
}
