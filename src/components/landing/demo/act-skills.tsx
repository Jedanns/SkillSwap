"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ACT2_IN, ACT2_OUT, seg } from "./demo-timeline";

type Skill = { name: string; level: string; accent: string };

const SKILLS: Skill[] = [
  { name: "React", level: "Niveau 3", accent: "#c7ddf2" },
  { name: "Anglais", level: "Niveau 2", accent: "#c8f59d" },
  { name: "Gant", level: "Niveau 1", accent: "#ffa06a" },
];

type ActSkillsProps = {
  u: number;
  selectedSkill: string | null;
  onSelect: (name: string) => void;
};

/**
 * Act 2 — "En tant qu'étudiant :" on the now-light portal, with three skill
 * cards. Scroll is gated here (handled by the portal): the user must click a
 * card. On selection the heading and the other cards fade out and the chosen
 * card glides to the centre, then scroll unlocks toward the planning.
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

  const handleSelect = (name: string, index: number) => {
    const card = cardRefs.current[index];
    const container = containerRef.current;
    if (card && container) {
      const c = container.getBoundingClientRect();
      const k = card.getBoundingClientRect();
      setDeltaX(c.left + c.width / 2 - (k.left + k.width / 2));
    }
    onSelect(name);
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
        Ton profil
      </span>
      <h2
        className="mt-3 text-center font-heading text-[clamp(24px,3.6vw,44px)] font-bold tracking-[-0.03em] text-ink transition-opacity duration-500"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        En tant qu&apos;étudiant&nbsp;:
      </h2>

      <div
        ref={containerRef}
        className="relative mt-12 flex w-full max-w-3xl flex-wrap items-stretch justify-center gap-4 sm:gap-6"
      >
        {SKILLS.map((skill, index) => {
          const isSelected = selectedSkill === skill.name;
          const cardStyle: React.CSSProperties = collapsed
            ? isSelected
              ? { transform: `translateX(${deltaX}px) scale(1.12)`, zIndex: 2 }
              : { opacity: 0, transform: "scale(0.85) translateY(12px)" }
            : {};
          return (
            <button
              key={skill.name}
              type="button"
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              onClick={() => handleSelect(skill.name, index)}
              disabled={collapsed}
              aria-label={`Choisir la compétence ${skill.name}`}
              className={cn(
                "group flex w-[160px] flex-col gap-4 rounded-[24px] border border-black/10 bg-white p-6 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500",
                !collapsed &&
                  "cursor-pointer hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.12)]",
              )}
              style={{
                ...cardStyle,
                pointerEvents: interactive ? "auto" : "none",
              }}
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl font-heading text-[18px] font-black text-ink"
                style={{ backgroundColor: skill.accent }}
                aria-hidden
              >
                {skill.name.charAt(0)}
              </span>
              <span className="font-heading text-[20px] font-bold tracking-[-0.02em] text-ink">
                {skill.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40">
                {skill.level}
              </span>
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
