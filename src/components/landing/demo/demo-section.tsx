type DemoSectionProps = {
  /** Step number shown in the placeholder ("ÉTAPE {step}"). */
  step: number;
  /** CSS color for the ambient orb + ghost numeral (rotated per section). */
  accentColor: string;
};

/**
 * Content of a single step scene. It has no motion of its own — depth, fade and
 * zoom are applied by the enclosing <DemoScene>. Layers (dot grid, ambient orb,
 * ghost numeral, foreground box) stack to give the scene internal depth.
 */
export function DemoSection({ step, accentColor }: DemoSectionProps) {
  return (
    <>
      {/* Dot grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{ backgroundColor: accentColor, opacity: 0.28 }}
      />

      {/* Ghost numeral (deep behind the content) */}
      <span
        aria-hidden
        className="pointer-events-none absolute select-none font-heading font-black leading-none"
        style={{
          fontSize: "clamp(180px, 40vh, 460px)",
          color: accentColor,
          opacity: 0.08,
        }}
      >
        {String(step).padStart(2, "0")}
      </span>

      {/* Foreground placeholder box */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-3 rounded-[24px] border border-dashed border-white/10 px-8 py-16 text-center">
        <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-canvas/40">
          Étape {step}
        </span>
        <p className="text-[14px] text-canvas/30">
          Le contenu de démonstration sera ajouté ici
        </p>
      </div>
    </>
  );
}
