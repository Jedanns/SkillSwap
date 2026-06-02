"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ActCompleted } from "./act-completed";
import { ActDuality } from "./act-duality";
import { ActPlanning } from "./act-planning";
import { ActReview } from "./act-review";
import { ActSkills } from "./act-skills";
import { ActTutor } from "./act-tutor";
import { ChaosButton } from "./chaos-button";
import { type Skill } from "./demo-data";
import { DemoIntroScreen } from "./demo-intro-screen";
import styles from "./demo-portal.module.css";
import {
  GATE_U,
  INTRO_OUT,
  THEME_DARK,
  THEME_LIGHT,
  TOTAL_U,
  seg,
} from "./demo-timeline";
import { useDemoParallax } from "./use-demo-parallax";

type PanelInsets = { top: number; left: number };

const INK = [13, 13, 13];
const CANVAS = [242, 242, 240];

/** Linear blend between the ink and canvas brand colors (0 = ink, 1 = canvas). */
function themeColor(t: number): string {
  const c = INK.map((from, i) => Math.round(from + (CANVAS[i] - from) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/**
 * "Démonstration ?" easter-egg. A WebGL chaos pill that expands from the button
 * into a large panel playing a scripted, scroll-driven story: intro → "élève &
 * tuteur" → pick a skill (gated, theme turns light) → a Thursday 11:00 session
 * lands on the planning. Accessible modal: focus trap, Escape, focus restore;
 * auto-closes once the story ends.
 */
export default function DemoPortal() {
  const [mounted, setMounted] = useState(false); // panel in the DOM
  const [visible, setVisible] = useState(false); // expanded (drives transition)
  const [origin, setOrigin] = useState("50% 50%");
  const [insets, setInsets] = useState<PanelInsets>({ top: 0, left: 0 });
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollY, viewportH } = useDemoParallax(scrollRef, mounted);

  // Scroll position in "viewport heights", and derived story state.
  const u = viewportH > 0 ? scrollY / viewportH : 0;
  const unlocked = selectedSkill !== null;
  // Light during the student section, back to dark for the tutor section.
  const lightP = seg(u, THEME_LIGHT) * (1 - seg(u, THEME_DARK));
  const isLight = lightP > 0.5;
  const storyProgress = Math.min(1, u / TOTAL_U);

  // Scroll cannot pass the gate until a skill is chosen — enforced by capping
  // the track height (no scroll-fighting). After unlock the track extends.
  const trackHeight = viewportH
    ? (unlocked ? TOTAL_U + 1 : GATE_U + 1) * viewportH
    : "100%";

  const open = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const marginX = Math.max(vw * 0.05, (vw - 1200) / 2);
    const marginY = vh * 0.06;
    setInsets({ top: marginY, left: marginX });

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
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
      setSelectedSkill(null); // reset story for next open
      triggerRef.current?.focus();
    }, 500);
  }, []);

  // Auto-close once the story ends (only after the gate has been passed).
  useEffect(() => {
    if (!visible || !unlocked) return;
    if (u >= TOTAL_U - 0.05) {
      autoCloseTimer.current = setTimeout(close, 1000);
      return () => {
        if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      };
    }
  }, [visible, unlocked, u, close]);

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
    if (node) node.scrollTo({ top: node.clientHeight * 1.6, behavior: "smooth" });
  }, []);

  const introOpacity = 1 - seg(u, INTRO_OUT);
  const introScale = 1 + seg(u, INTRO_OUT) * 0.3;

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

          {/* Large panel that grows out of the button; bg shifts dark→light. */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Démonstration SkillSwap"
            className="fixed z-[100] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
            style={{
              top: insets.top,
              bottom: insets.top,
              left: insets.left,
              right: insets.left,
              backgroundColor: themeColor(lightP),
              transformOrigin: origin,
              transform: visible ? "scale(1)" : "scale(0.2)",
              opacity: visible ? 1 : 0,
              transition:
                "transform 500ms cubic-bezier(0.16,1,0.3,1), opacity 500ms cubic-bezier(0.16,1,0.3,1), background-color 200ms linear",
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
              className="absolute left-0 top-0 z-40 h-[2px] bg-gradient-to-r from-pistache to-peach"
              style={{ width: `${storyProgress * 100}%` }}
            />

            {/* Close button (adapts to the light/dark background) */}
            <button
              type="button"
              onClick={close}
              aria-label="Fermer la démonstration"
              className={cn(
                "absolute right-4 top-4 z-40 rounded-full border px-4 py-2 font-mono text-[13px] backdrop-blur-sm transition-colors sm:right-6 sm:top-6",
                isLight
                  ? "border-black/10 bg-black/[0.04] text-ink hover:bg-black/[0.08]"
                  : "border-white/[0.12] bg-white/[0.08] text-canvas hover:bg-white/[0.14]",
              )}
            >
              Fermer ✕
            </button>

            {/* Inner scroll container: tall track for distance + pinned stage. */}
            <div
              ref={scrollRef}
              className="relative z-10 h-full overflow-y-auto overflow-x-hidden"
            >
              <div className="relative w-full" style={{ height: trackHeight }}>
                <div
                  className="sticky top-0 w-full overflow-hidden"
                  style={{ height: viewportH || "100%" }}
                >
                  {/* Act 0 — Intro */}
                  <div
                    aria-hidden={introOpacity <= 0.05}
                    className="absolute inset-0 z-10 flex items-center justify-center px-6"
                    style={{
                      opacity: introOpacity,
                      transform: `scale(${introScale})`,
                      pointerEvents: introOpacity > 0.5 ? "auto" : "none",
                      willChange: "opacity, transform",
                    }}
                  >
                    <DemoIntroScreen onScrollNext={scrollToFirstStep} />
                  </div>

                  {/* Act 1 — élève & tuteur */}
                  <ActDuality u={u} viewportH={viewportH} />

                  {/* Act 2 — pick a skill (gated, light theme) */}
                  <ActSkills
                    u={u}
                    selectedSkill={selectedSkill}
                    onSelect={setSelectedSkill}
                  />

                  {/* Act 3 — planning + Thursday 11:00 session */}
                  <ActPlanning u={u} skill={selectedSkill} />

                  {/* Act 4 — course completed (card + green check) */}
                  <ActCompleted u={u} skill={selectedSkill} />

                  {/* Act 5 — review the course & the tutor */}
                  <ActReview u={u} skill={selectedSkill} />

                  {/* Act 6 — switch to tutor (back to dark) */}
                  <ActTutor u={u} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
