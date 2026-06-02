"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { SKILLS, type Skill } from "./demo-data";
import { ACT2_IN, ACT2_OUT, seg } from "./demo-timeline";

type ActSkillsProps = {
  u: number;
  selectedSkill: Skill | null;
  onSelect: (skill: Skill) => void;
};

/**
 * Act 2 — "En tant qu'étudiant :" on the now-light portal. Three skill offerings
 * proposed by peer tutors. Scroll is gated here (by the portal): the user must
 * pick one. On selection the heading and the other cards fade out and the chosen
 * offering glides to the centre, then scroll unlocks toward the planning.
 */
export function ActSkills({ u, selectedSkill, onSelect }: ActSkillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [deltaX, setDeltaX] = useState(0);

  const inP = seg(u, ACT2_IN);
  const outP = seg(u, ACT2_OUT);
  const opacity = inP * (1 - outP);
  const scale = 0.94 + inP * 0.06 + outP * 0.1;
  const collapsed = selectedSkill !== null;
  const interactive = opacity > 0.5 && !collapsed;

  const handleSelect = (skill: Skill, index: number) => {
    const card = cardRefs.current[index];
    const container = containerRef.current;
    if (card && container) {
      const c = container.getBoundingClientRect();
      const k = card.getBoundingClientRect();
      setDeltaX(c.left + c.width / 2 - (k.left + k.width / 2));
    }
    onSelect(skill);
  };

  return (
    <div
      aria-hidden={opacity <= 0.5}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-ink"
      style={{
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <span
        className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink/40 transition-opacity duration-500"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        Apprendre
      </span>
      <h2
        className="mt-3 text-center font-heading text-[clamp(24px,3.6vw,44px)] font-bold tracking-[-0.03em] text-ink transition-opacity duration-500"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        En tant qu&apos;étudiant&nbsp;:
      </h2>

      <div
        ref={containerRef}
        className="relative mt-12 flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-4 sm:gap-6"
      >
        {SKILLS.map((skill, index) => {
          const isSelected = selectedSkill?.name === skill.name;
          const cardStyle: React.CSSProperties = collapsed
            ? isSelected
              ? { transform: `translateX(${deltaX}px) scale(1.1)`, zIndex: 2 }
              : { opacity: 0, transform: "scale(0.85) translateY(12px)" }
            : {};
          return (
            <button
              key={skill.name}
              type="button"
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              onClick={() => handleSelect(skill, index)}
              disabled={collapsed}
              aria-label={`Apprendre ${skill.name} avec ${skill.tutor}`}
              className={cn(
                "group flex w-[230px] flex-col gap-4 rounded-[24px] border border-black/10 bg-white p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500",
                !collapsed &&
                  "cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.12)]",
              )}
              style={{
                ...cardStyle,
                pointerEvents: interactive ? "auto" : "none",
              }}
            >
              {/* Tutor proposing the skill */}
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full font-heading text-[15px] font-black text-ink"
                  style={{ backgroundColor: skill.accent }}
                  aria-hidden
                >
                  {skill.initial}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-ink">
                    {skill.tutor}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/40">
                    Propose · {skill.level}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-heading text-[24px] font-bold tracking-[-0.02em] text-ink">
                  {skill.name}
                </span>
                <p className="text-[13px] leading-snug text-ink/55">
                  {skill.blurb}
                </p>
              </div>

              <div className="mt-auto flex items-center gap-1.5 border-t border-black/5 pt-3 text-[12px] text-ink/60">
                <span aria-hidden className="text-peach">
                  ★
                </span>
                <span className="font-semibold text-ink">{skill.rating}</span>
                <span className="text-ink/40">· {skill.reviews} avis</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.08em] text-deep-green">
                  Choisir →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p
        className="mt-10 font-mono text-[12px] uppercase tracking-[0.1em] text-ink/40 transition-opacity duration-300"
        style={{ opacity: collapsed || opacity <= 0.5 ? 0 : 1 }}
      >
        Choisis une compétence pour continuer
      </p>
    </div>
  );
}
