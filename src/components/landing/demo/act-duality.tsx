import { ACT1_IN, ACT1_OUT, ACT1_SETTLE, seg } from "./demo-timeline";

type ActDualityProps = {
  u: number;
  viewportH: number;
};

const ROLES = [
  {
    label: "Élève",
    accent: "#c8f59d",
    desc: "Tu apprends une compétence auprès d'un pair qui la maîtrise.",
  },
  {
    label: "Tuteur",
    accent: "#ffa06a",
    desc: "Tu transmets ce que tu sais déjà à quelqu'un qui débute.",
  },
];

/**
 * Act 1 — "Chaque étudiant est à la fois élève et tuteur". As the user scrolls
 * the headline settles toward the top and the two role cards (Élève / Tuteur)
 * rise into view beneath it.
 */
export function ActDuality({ u, viewportH }: ActDualityProps) {
  const inP = seg(u, ACT1_IN);
  const settleP = seg(u, ACT1_SETTLE);
  const outP = seg(u, ACT1_OUT);

  const opacity = inP * (1 - outP);
  const scale = 0.94 + inP * 0.06 + outP * 0.12;
  const interactive = opacity > 0.5;

  // Whole stack drifts up a little as the cards arrive (title "settles" up).
  const stackShift = -settleP * viewportH * 0.12;

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
        className="flex w-full max-w-3xl flex-col items-center"
        style={{ transform: `translateY(${stackShift}px)` }}
      >
        <h2 className="max-w-[640px] text-center font-heading text-[clamp(24px,3.6vw,46px)] font-bold leading-[1.12] tracking-[-0.03em] text-canvas">
          Chaque étudiant est à la fois{" "}
          <span className="bg-gradient-to-r from-pistache to-pistache bg-clip-text text-transparent">
            élève
          </span>{" "}
          et{" "}
          <span className="bg-gradient-to-r from-peach to-peach bg-clip-text text-transparent">
            tuteur
          </span>
          .
        </h2>

        <div
          className="mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6"
          style={{
            opacity: settleP,
            transform: `translateY(${(1 - settleP) * 48}px)`,
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
