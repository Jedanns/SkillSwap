import { ACT6_IN, seg } from "./demo-timeline";

type ActTutorProps = {
  u: number;
};

/**
 * Act 6 — the portal switches back to the dark style and flips the perspective:
 * "En tant que tuteur :" — now it's the student's turn to teach.
 */
export function ActTutor({ u }: ActTutorProps) {
  const inP = seg(u, ACT6_IN);

  return (
    <div
      aria-hidden={inP <= 0.5}
      className="absolute inset-0 z-[55] flex flex-col items-center justify-center px-6 text-center text-canvas"
      style={{
        opacity: inP,
        transform: `scale(${0.95 + inP * 0.05})`,
        pointerEvents: inP > 0.5 ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-canvas/40">
        Transmettre
      </span>
      <h2 className="mt-3 max-w-[640px] font-heading text-[clamp(26px,4vw,52px)] font-bold leading-[1.1] tracking-[-0.03em] text-canvas">
        En tant que{" "}
        <span className="text-peach">tuteur</span>&nbsp;:
      </h2>
      <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-canvas/50">
        À ton tour de transmettre ce que tu maîtrises et d&apos;accompagner un
        autre étudiant.
      </p>
    </div>
  );
}
