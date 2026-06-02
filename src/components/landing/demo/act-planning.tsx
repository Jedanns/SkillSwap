import { ACT3_IN, ACT3_SESSION, seg } from "./demo-timeline";

type ActPlanningProps = {
  u: number;
  selectedSkill: string | null;
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];
const HOURS = [9, 10, 11, 12, 13];

// Thursday 11:00 → column 5 (col 1 is the time gutter), row 4 (row 1 is header).
const SESSION_COL = DAYS.indexOf("Jeu") + 2;
const SESSION_ROW = HOURS.indexOf(11) + 2;

/**
 * Act 3 — the weekly planning. The grid fades in, then a session block lands on
 * Thursday 11:00 with its details (chosen skill, tutor, description).
 */
export function ActPlanning({ u, selectedSkill }: ActPlanningProps) {
  const inP = seg(u, ACT3_IN);
  const sessionP = seg(u, ACT3_SESSION);
  const skill = selectedSkill ?? "React";

  return (
    <div
      aria-hidden={inP <= 0.5}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-ink"
      style={{
        opacity: inP,
        transform: `scale(${0.95 + inP * 0.05})`,
        pointerEvents: inP > 0.5 ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink/40">
        Ton planning
      </span>
      <h2 className="mt-3 text-center font-heading text-[clamp(22px,3.2vw,38px)] font-bold tracking-[-0.03em] text-ink">
        Une session est réservée
      </h2>

      <div
        className="mt-8 grid w-full max-w-2xl gap-px rounded-[20px] border border-black/10 bg-black/10 p-px"
        style={{
          gridTemplateColumns: "48px repeat(5, 1fr)",
          gridTemplateRows: `auto repeat(${HOURS.length}, minmax(48px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="bg-canvas" />
        {DAYS.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center bg-canvas py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50"
          >
            {day}
          </div>
        ))}

        {/* Hour rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="flex items-start justify-end bg-canvas px-2 py-1 font-mono text-[10px] text-ink/40">
              {hour}h
            </div>
            {DAYS.map((day) => (
              <div key={`${day}-${hour}`} className="bg-canvas" />
            ))}
          </div>
        ))}

        {/* Session block — lands on Thursday 11:00 */}
        <div
          className="z-10 m-1 flex flex-col justify-center gap-1 rounded-[14px] p-3 text-left shadow-[0_10px_30px_rgba(36,79,67,0.35)]"
          style={{
            gridColumn: SESSION_COL,
            gridRow: SESSION_ROW,
            backgroundColor: "#244f43",
            opacity: sessionP,
            transform: `scale(${0.8 + sessionP * 0.2})`,
            transformOrigin: "center",
          }}
        >
          <span className="font-heading text-[13px] font-bold leading-tight text-canvas">
            {skill}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-pistache">
            Jeu · 11:00
          </span>
        </div>
      </div>

      {/* Session details card */}
      <div
        className="mt-6 w-full max-w-2xl rounded-[18px] border border-black/10 bg-white p-5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        style={{
          opacity: sessionP,
          transform: `translateY(${(1 - sessionP) * 16}px)`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-heading text-[16px] font-bold tracking-[-0.02em] text-ink">
            {skill} · Jeudi 11:00 – 12:00
          </span>
          <span className="rounded-full bg-deep-green px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-canvas">
            Confirmée
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
          Session découverte avec Léa M. — bases, questions et exercices guidés.
        </p>
      </div>
    </div>
  );
}
