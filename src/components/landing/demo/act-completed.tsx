import { type Skill } from "./demo-data";
import { ACT4_CHECK, ACT4_IN, ACT4_OUT, seg } from "./demo-timeline";

type ActCompletedProps = {
  u: number;
  skill: Skill | null;
};

/**
 * Act 4 — the chosen skill card reappears and a green check pops onto it once
 * the session is done.
 */
export function ActCompleted({ u, skill }: ActCompletedProps) {
  const inP = seg(u, ACT4_IN);
  const outP = seg(u, ACT4_OUT);
  const checkP = seg(u, ACT4_CHECK);
  const opacity = inP * (1 - outP);

  const s = skill ?? {
    name: "React",
    tutor: "Maxime D.",
    initial: "M",
    level: "Avancé",
    accent: "#c7ddf2",
    rating: 4.9,
    reviews: 23,
    blurb: "",
  };

  return (
    <div
      aria-hidden={opacity <= 0.5}
      className="absolute inset-0 z-[45] flex flex-col items-center justify-center px-6 text-ink"
      style={{
        opacity,
        transform: `scale(${0.95 + inP * 0.05 + outP * 0.08})`,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink/40">
        Session terminée
      </span>
      <h2 className="mt-3 text-center font-heading text-[clamp(22px,3.2vw,38px)] font-bold tracking-[-0.03em] text-ink">
        Cours terminé&nbsp;!
      </h2>

      <div
        className="relative mt-10 flex w-[260px] flex-col gap-4 rounded-[24px] border border-black/10 bg-white p-5 text-left shadow-[0_18px_50px_rgba(0,0,0,0.1)]"
        style={{ transform: `scale(${0.92 + inP * 0.08})` }}
      >
        {/* Green check badge */}
        <span
          className="absolute -right-3 -top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3CB371] text-canvas shadow-[0_6px_20px_rgba(60,179,113,0.5)]"
          style={{
            opacity: checkP,
            transform: `scale(${0.4 + checkP * 0.6})`,
          }}
          aria-label="Cours validé"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full font-heading text-[15px] font-black text-ink"
            style={{ backgroundColor: s.accent }}
            aria-hidden
          >
            {s.initial}
          </span>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-ink">{s.tutor}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/40">
              {s.level}
            </span>
          </div>
        </div>

        <span className="font-heading text-[24px] font-bold tracking-[-0.02em] text-ink">
          {s.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#3CB371]">
          ✓ Compétence pratiquée
        </span>
      </div>
    </div>
  );
}
