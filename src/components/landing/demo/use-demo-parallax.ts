"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

type DemoParallax = {
  /** Raw scrollTop of the inner container, drives every layer transform. */
  scrollY: number;
  /** Scroll progress through the container, 0 → 1 (drives the progress bar). */
  progress: number;
  /** Visible height of the scroll container — the unit for scroll-driven math. */
  viewportH: number;
};

/**
 * Tracks scroll position + viewport height of the portal's inner scroll
 * container. A single rAF-throttled scroll listener feeds the progress bar and
 * every scroll-driven layer; children derive their own reveal/parallax from
 * `scrollY`, `viewportH` and their measured offset.
 */
export function useDemoParallax(
  scrollRef: RefObject<HTMLElement | null>,
  active: boolean,
): DemoParallax {
  const [state, setState] = useState<DemoParallax>({
    scrollY: 0,
    progress: 0,
    viewportH: 0,
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (!active || !node) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const max = node.scrollHeight - node.clientHeight;
      const top = node.scrollTop;
      setState({
        scrollY: top,
        progress: max > 0 ? Math.min(1, Math.max(0, top / max)) : 0,
        viewportH: node.clientHeight,
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update(); // prime initial values

    return () => {
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRef, active]);

  return state;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when the user has requested reduced motion (SSR-safe, no flash). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Clamp to [0, 1]. */
export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Smoothstep easing between edges a and b. */
export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Smootherstep (Ken Perlin) — gentler accel/decel than smoothstep. */
export function smootherstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
