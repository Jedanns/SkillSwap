import { ACT1_IN, ACT1_OUT, ACT1_SETTLE, seg } from "./demo-timeline";

type ActDualityProps = {
  u: number;
  viewportH: number;
};

const ROLES = [
  {
    label: "Élève",
    accent: "#4fa3b1",
    desc: "Tu apprends une compétence auprès d'un pair qui la maîtrise.",
  },
  {
    label: "Tuteur",
    accent: "#5b1e78",
    desc: "Tu transmets ce que tu sais déjà à quelqu'un qui débute.",
  },
];

/**
 * Act 1 — "Chaque étudiant est à la fois élève et tuteur". The headline arrives
 * perfectly centered; as the user scrolls it rises toward the top while the two
 * role cards (Élève / Tuteur) — positioned absolutely so they never push the
 * title off-centre — slide into view beneath it.
 */
export function ActDuality({ u, viewportH }: ActDualityProps) {
  const inP = seg(u, ACT1_IN);
  const settleP = seg(u, ACT1_SETTLE);
  const outP = seg(u, ACT1_OUT);

  const opacity = inP * (1 - outP);
  const scale = 0.94 + inP * 0.06 + outP * 0.12;
  const interactive = opacity > 0.5;

  // Whole stack drifts up as the cards arrive (title "settles" toward the top).
  const stackShift = -settleP * viewportH * 0.16;

  return (
    <div
      aria-hidden={!interactive}
      className="absolute inset-0 z-20 flex items-center justify-center px-6"
      style={{
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: interactive ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{ transform: `translateY(${stackShift}px)` }}
      >
        <h2 className="max-w-[640px] text-center font-heading text-[clamp(24px,3.6vw,46px)] font-bold leading-[1.12] tracking-[-0.03em] text-canvas">
          Chaque étudiant est à la fois{" "}
          <span className="text-pistache">élève</span> et{" "}
          <span className="text-peach">tuteur</span>.
        </h2>

        {/* Absolutely positioned below the title so they don't affect centring. */}
        <div
          className="absolute left-1/2 top-full grid w-[min(90vw,640px)] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
          style={{
            opacity: settleP,
            transform: `translate(-50%, ${40 + (1 - settleP) * 40}px)`,
          }}
        >
          {ROLES.map((role) => (
            <div
              key={role.label}
              className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-7 text-left backdrop-blur-sm"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: role.accent }}
                aria-hidden
              />
              <span className="font-heading text-[22px] font-bold tracking-[-0.02em] text-canvas">
                {role.label}
              </span>
              <p className="text-[14px] leading-relaxed text-canvas/50">
                {role.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
