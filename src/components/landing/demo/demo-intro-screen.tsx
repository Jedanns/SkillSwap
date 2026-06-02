import { cn } from "@/lib/utils";

import styles from "./demo-portal.module.css";

type DemoIntroScreenProps = {
  /** Inner-container scrollTop, drives the ambient-orb parallax. */
  scrollY: number;
  /** Smooth-scroll to the first step section. */
  onScrollNext: () => void;
};

/**
 * Screen 1 of the portal — a full-viewport intro. Ambient orbs drift at 0.3×
 * scroll speed; the label, headline and scroll hint fade in on a stagger.
 */
export function DemoIntroScreen({ scrollY, onScrollNext }: DemoIntroScreenProps) {
  return (
    <section className="relative flex h-full min-h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Ambient orbs (parallax 0.3×) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pistache/40 blur-[80px]"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-peach/40 blur-[80px]"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <span
          className={cn(
            styles.fadeUp,
            "font-mono text-[12px] uppercase tracking-[0.1em] text-canvas/40",
          )}
          style={{ animationDelay: "0.3s" }}
        >
          SkillSwap — DSP F2I
        </span>

        <h2
          className={cn(
            styles.fadeUp,
            "mt-7 max-w-[600px] font-heading text-[clamp(22px,3.5vw,44px)] font-bold leading-[1.15] tracking-[-0.03em] text-canvas",
          )}
          style={{ animationDelay: "0.5s" }}
        >
          SkillSwap est une application{" "}
          <span className="bg-gradient-to-r from-pistache to-peach bg-clip-text text-transparent">
            par les étudiants
          </span>{" "}
          pour les étudiants, jusqu&apos;à son fonctionnement.
        </h2>

        <button
          type="button"
          onClick={onScrollNext}
          className={cn(
            styles.fadeUp,
            "group mt-14 flex flex-col items-center gap-2 text-canvas/40 transition-colors hover:text-canvas/70",
          )}
          style={{ animationDelay: "0.9s" }}
          aria-label="Faire défiler vers la première étape"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
            Scroll
          </span>
          <svg
            className={styles.bounceArrow}
            width="16"
            height="28"
            viewBox="0 0 16 28"
            fill="none"
            aria-hidden
          >
            <path
              d="M8 1v22"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M2 17l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
