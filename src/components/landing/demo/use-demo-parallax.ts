"use client";

import { useEffect, useState, type RefObject } from "react";

type DemoParallax = {
  /** Raw scrollTop of the inner container, used to derive layer transforms. */
  scrollY: number;
  /** Scroll progress through the container, 0 → 1. */
  progress: number;
};

/**
 * Tracks scroll position of the portal's inner scroll container and derives a
 * 0→1 progress value. A single rAF-throttled scroll listener feeds both the
 * progress bar and the parallax layers (orbs at 0.3×, dot grids at 0.15×).
 */
export function useDemoParallax(
  scrollRef: RefObject<HTMLElement | null>,
  /** Re-attach when the container mounts/unmounts (e.g. portal open state). */
  active: boolean,
): DemoParallax {
  const [state, setState] = useState<DemoParallax>({ scrollY: 0, progress: 0 });

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
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    node.addEventListener("scroll", onScroll, { passive: true });
    update(); // prime initial values

    return () => {
      node.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRef, active]);

  return state;
}
