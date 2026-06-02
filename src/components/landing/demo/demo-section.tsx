"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import styles from "./demo-portal.module.css";

type DemoSectionProps = {
  /** Step number shown in the placeholder ("ÉTAPE {step}"). */
  step: number;
  /** CSS color for the centered ambient orb (rotated per section). */
  accentColor: string;
  /** Inner-container scrollTop, drives the dot-grid parallax. */
  scrollY: number;
};

/**
 * Reusable placeholder step screen (100vh). The dot grid drifts at 0.15× scroll
 * speed relative to the section's own offset; the section fades in from below the
 * first time it enters the viewport (own IntersectionObserver, observe-once —
 * same pattern as components/landing/reveal.tsx).
 */
export function DemoSection({ step, accentColor, scrollY }: DemoSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    setOffsetTop(node.offsetTop);

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex h-full min-h-full items-center justify-center overflow-hidden border-t border-white/[0.05] px-6"
    >
      {/* Dot grid (parallax 0.15× relative to section offset) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          transform: `translateY(${(scrollY - offsetTop) * 0.15}px)`,
        }}
      />

      {/* Centered ambient orb (parallax 0.2×) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{
          backgroundColor: accentColor,
          opacity: 0.25,
          transform: `translate(-50%, calc(-50% + ${scrollY * 0.2}px))`,
        }}
      />

      <div
        className={cn(
          styles.section,
          visible && styles.sectionVisible,
          "relative z-10 flex w-full max-w-md flex-col items-center gap-3 rounded-[24px] border border-dashed border-white/10 px-8 py-16 text-center",
        )}
      >
        <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-canvas/40">
          Étape {step}
        </span>
        <p className="text-[14px] text-canvas/30">
          Le contenu de démonstration sera ajouté ici
        </p>
      </div>
    </section>
  );
}
