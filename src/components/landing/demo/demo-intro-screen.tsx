import { cn } from "@/lib/utils";

import styles from "./demo-portal.module.css";

type DemoIntroScreenProps = {
  /** Smooth-scroll to the first step scene. */
  onScrollNext: () => void;
};

/**
 * Content of the intro scene. On open the label/headline/scroll-hint fade in on
 * a stagger (CSS); the depth exit (fade + zoom as you advance) is applied by the
 * enclosing <DemoScene>, so there is no vertical scroll motion here.
 */
export function DemoIntroScreen({ onScrollNext }: DemoIntroScreenProps) {
  return (
    <>
      {/* Ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pistache/40 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-peach/40 blur-[80px]"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
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
    </>
  );
}
