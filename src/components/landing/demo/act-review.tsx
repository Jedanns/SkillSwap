"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { type Skill } from "./demo-data";
import { ACT5_IN, ACT5_OUT, seg } from "./demo-timeline";

type ActReviewProps = {
  u: number;
  skill: Skill | null;
};

type StarRowProps = {
  label: string;
  value: number;
  onRate: (v: number) => void;
};

function StarRow({ label, value, onRate }: StarRowProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="font-heading text-[16px] font-bold tracking-[-0.02em] text-ink">
        {label}
      </span>
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${label} : ${n} étoile${n > 1 ? "s" : ""}`}
            aria-pressed={value === n}
            className={cn(
              "text-[30px] leading-none transition-transform duration-150 hover:scale-125",
              n <= shown ? "text-peach" : "text-black/15",
            )}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Act 5 — review the course and the tutor, five stars each (interactive).
 */
export function ActReview({ u, skill }: ActReviewProps) {
  const [courseRating, setCourseRating] = useState(0);
  const [tutorRating, setTutorRating] = useState(0);

  const inP = seg(u, ACT5_IN);
  const outP = seg(u, ACT5_OUT);
  const opacity = inP * (1 - outP);

  const tutor = skill?.tutor ?? "Maxime D.";
  const done = courseRating > 0 && tutorRating > 0;

  return (
    <div
      aria-hidden={opacity <= 0.5}
      className="absolute inset-0 z-[50] flex flex-col items-center justify-center px-6 text-ink"
      style={{
        opacity,
        transform: `scale(${0.95 + inP * 0.05 + outP * 0.08})`,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink/40">
        Ton avis compte
      </span>
      <h2 className="mt-3 text-center font-heading text-[clamp(22px,3.2vw,38px)] font-bold tracking-[-0.03em] text-ink">
        Note ta session
      </h2>

      <div className="mt-12 flex w-full max-w-2xl flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-20">
        <StarRow label="Le cours" value={courseRating} onRate={setCourseRating} />
        <StarRow label={tutor} value={tutorRating} onRate={setTutorRating} />
      </div>

      <p
        className="mt-12 font-mono text-[12px] uppercase tracking-[0.1em] text-deep-green transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0 }}
      >
        Merci pour ton retour ✓
      </p>
    </div>
  );
}
