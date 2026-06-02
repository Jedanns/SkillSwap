import Image from "next/image";

import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** Kept for API compatibility; the logo is a fixed-gradient image. */
  tone?: "ink" | "surface";
};

/**
 * SkillSwap brand wordmark — the official gradient logo (transparent PNG).
 * Used in the navbar and footer. Size it via `className` (defaults to h-8).
 */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <Image
      src="/Skillswaplogotest.png"
      alt="SkillSwap"
      width={1672}
      height={941}
      priority
      className={cn("h-8 w-auto", className)}
    />
  );
}
