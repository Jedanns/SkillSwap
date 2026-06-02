import { smootherstep } from "./use-demo-parallax";

/**
 * The demo plays as a scripted timeline driven by one scroll value
 * `u = scrollTop / viewportH` (units = "viewport heights scrolled"). Each act
 * reads `u` and derives its own appearance from the ranges below, so the whole
 * sequence stays in sync. One hard gate (GATE_U) blocks scroll until the user
 * picks a skill — enforced by capping the scroll track height in the portal.
 */

// Intro ("SkillSwap est une application…") zooms/fades out.
export const INTRO_OUT = [0.6, 1.4] as const;

// Act 1 — "Chaque étudiant est à la fois élève et tuteur".
export const ACT1_IN = [1.0, 1.7] as const; // arrives, centered
export const ACT1_SETTLE = [1.8, 2.6] as const; // title rises, two cards appear
export const ACT1_OUT = [2.8, 3.4] as const; // leaves

// Global theme shifts dark → light around the student act.
export const THEME_LIGHT = [3.3, 3.95] as const;

// Act 2 — "En tant qu'étudiant :" + 3 skill cards (gated).
export const ACT2_IN = [3.4, 4.0] as const;
export const ACT2_OUT = [5.0, 5.6] as const;
export const GATE_U = 4.0; // scroll cannot pass this until a skill is chosen

// Act 3 — weekly planning + the Thursday 11:00 session.
export const ACT3_IN = [4.9, 5.6] as const;
export const ACT3_SESSION = [5.4, 6.0] as const;

// End of the story → the portal auto-closes here.
export const TOTAL_U = 6.0;

/** Eased 0→1 progress of `u` across a [start, end] range. */
export function seg(u: number, range: readonly [number, number]): number {
  return smootherstep(range[0], range[1], u);
}
