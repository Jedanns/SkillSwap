import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  /** Tone of the text — dark on light surfaces, light on the deep-green footer. */
  tone?: "ink" | "surface";
};

/**
 * SkillSwap wordmark: a small geometric "swap" glyph (two interlocking arrows)
 * built inline as SVG so it needs no asset, plus the name. Used in the navbar
 * and footer.
 */
export function Wordmark({ className, tone = "ink" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-heading text-lg font-extrabold tracking-[-0.02em]",
        tone === "ink" ? "text-ink" : "text-surface",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-lg bg-deep-green"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 5.5h7.5M8.5 3 11 5.5 8.5 8"
            stroke="#C8F59D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 10.5H5.5M7.5 13 5 10.5 7.5 8"
            stroke="#FFA06A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      SkillSwap
    </span>
  );
}
