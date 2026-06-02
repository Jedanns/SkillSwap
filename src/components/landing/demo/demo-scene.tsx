"use client";

import type { ReactNode } from "react";

import { clamp01, smoothstep } from "./use-demo-parallax";

type DemoSceneProps = {
  /** Scroll distance from this scene: 0 = framed, <0 = still behind (deeper),
   *  >0 = passed (zoomed through). */
  distance: number;
  reduced: boolean;
  children: ReactNode;
};

/**
 * A pinned scene in the depth stack. Scrolling never moves a scene vertically —
 * instead each scene cross-fades and scales along the z-axis: the framed scene
 * dissolves while zooming toward the viewer, and the next one emerges from
 * behind (smaller, blurred → focused). This reads as advancing forward through
 * layers rather than scrolling down a list.
 */
export function DemoScene({ distance, reduced, children }: DemoSceneProps) {
  const ad = Math.abs(distance);
  const interactive = ad < 0.5;

  // Upcoming scenes sit behind (scale < 1, blurred); passed scenes zoom
  // through the viewer (scale > 1) as they fade.
  const opacity = reduced ? clamp01(1 - ad) : 1 - smoothstep(0, 0.9, ad);
  const scale = reduced ? 1 : 1 + distance * 0.35;
  const blur = reduced ? 0 : clamp01(ad) * 12;

  return (
    <div
      aria-hidden={!interactive}
      className="absolute inset-0 flex items-center justify-center overflow-hidden px-6"
      style={{
        opacity,
        transform: `scale(${scale})`,
        filter: blur ? `blur(${blur}px)` : undefined,
        zIndex: Math.round(100 - ad * 10),
        pointerEvents: interactive ? "auto" : "none",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
