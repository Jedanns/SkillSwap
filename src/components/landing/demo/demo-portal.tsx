"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ChaosButton } from "./chaos-button";
import { DemoIntroScreen } from "./demo-intro-screen";
import { DemoSection } from "./demo-section";
import styles from "./demo-portal.module.css";
import { useDemoParallax } from "./use-demo-parallax";

const SECTIONS = [
  { step: 1, accentColor: "#c7ddf2" }, // powder
  { step: 2, accentColor: "#c8f59d" }, // pistache
  { step: 3, accentColor: "#ffa06a" }, // peach
];

type PanelInsets = { top: number; left: number };

/**
 * "Démonstration ?" easter-egg. An idle WebGL chaos pill that, on click,
 * expands *from the button* into a large (but not full-screen) scroll-driven
 * dark panel — intro + placeholder steps, parallax layers, progress bar. It
 * auto-closes once the user scrolls to the bottom. Accessible modal: focus
 * trap, Escape to close, focus restored to the trigger on close.
 */
export default function DemoPortal() {
  const [mounted, setMounted] = useState(false); // panel in the DOM
  const [visible, setVisible] = useState(false); // expanded (drives transition)
  const [origin, setOrigin] = useState("50% 50%");
  const [insets, setInsets] = useState<PanelInsets>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollY, progress } = useDemoParallax(scrollRef, mounted);

  const open = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Large but not full-screen: ~6vh band top/bottom, width capped at 1200px.
    const marginX = Math.max(vw * 0.05, (vw - 1200) / 2);
    const marginY = vh * 0.06;
    setInsets({ top: marginY, left: marginX });

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Transform-origin in the panel's local space → grows out of the button.
      const ox = rect.left + rect.width / 2 - marginX;
      const oy = rect.top + rect.height / 2 - marginY;
      setOrigin(`${ox}px ${oy}px`);
    }

    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const close = useCallback(() => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    setVisible(false);
    closeTimer.current = setTimeout(() => {
      setMounted(false);
      triggerRef.current?.focus();
    }, 500);
  }, []);

  // Auto-close once the user has scrolled to the bottom.
  useEffect(() => {
    if (!visible) return;
    if (progress >= 0.99) {
      autoCloseTimer.current = setTimeout(close, 900);
      return () => {
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      };
    }
  }, [visible, progress, close]);

  // Lock body scroll, wire Escape + focus trap, seed focus while open.
  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, close]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, []);

  const scrollToFirstStep = useCallback(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.clientHeight, behavior: "smooth" });
  }, []);

  return (
    <div className="flex justify-center px-4 py-[clamp(48px,8vw,96px)]">
      <ChaosButton
        ref={triggerRef}
        label="Démonstration ?"
        onClick={open}
        aria-expanded={mounted}
      />

      {mounted && (
        <>
          {/* Dimmed backdrop — click to close. */}
          <div
            aria-hidden
            onClick={close}
            className="fixed inset-0 z-[90] bg-ink/70 backdrop-blur-sm transition-opacity duration-500"
            style={{ opacity: visible ? 1 : 0 }}
          />

          {/* Large (not full-screen) panel that grows out of the button. */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Démonstration SkillSwap"
            className="fixed z-[100] overflow-hidden rounded-[32px] border border-white/10 bg-ink shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
            style={{
              top: insets.top,
              bottom: insets.top,
              left: insets.left,
              right: insets.left,
              transformOrigin: origin,
              transform: visible ? "scale(1)" : "scale(0.2)",
              opacity: visible ? 1 : 0,
              transition:
                "transform 500ms cubic-bezier(0.16,1,0.3,1), opacity 500ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Noise texture overlay */}
            <div
              aria-hidden
              className={cn(
                styles.noise,
                "pointer-events-none absolute inset-0 z-20",
              )}
            />

            {/* Scroll progress bar */}
            <div
              aria-hidden
              className="absolute left-0 top-0 z-30 h-[2px] bg-gradient-to-r from-pistache to-peach"
              style={{ width: `${progress * 100}%` }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={close}
              aria-label="Fermer la démonstration"
              className="absolute right-4 top-4 z-30 rounded-full border border-white/[0.12] bg-white/[0.08] px-4 py-2 font-mono text-[13px] text-canvas backdrop-blur-sm transition-colors hover:bg-white/[0.14] sm:right-6 sm:top-6"
            >
              Fermer ✕
            </button>

            {/* Inner scroll container */}
            <div
              ref={scrollRef}
              className="relative z-10 h-full overflow-y-auto overflow-x-hidden"
            >
              <DemoIntroScreen
                scrollY={scrollY}
                onScrollNext={scrollToFirstStep}
              />
              {SECTIONS.map((s) => (
                <DemoSection
                  key={s.step}
                  step={s.step}
                  accentColor={s.accentColor}
                  scrollY={scrollY}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
