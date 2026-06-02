import { smootherstep } from "./use-demo-parallax";

/**
 * The demo plays as a scripted timeline driven by one scroll value
 * `u = scrollTop / viewportH` (units = "viewport heights scrolled"). Each act
 * reads `u` and derives its own appearance from the ranges below, so the whole
 * sequence stays in sync. One hard gate (GATE_U) blocks scroll until the user
 * picks a skill — enforced by capping the scroll track height in the portal.
 *
 * Theme: dark (intro, duality) → light (student: skills, planning, completed,
 * review) → dark again (tutor).
 */

// Intro ("SkillSwap est une application…") zooms/fades out.
export const INTRO_OUT = [0.6, 1.4] as const;

// Act 1 — "Chaque étudiant est à la fois élève et tuteur".
export const ACT1_IN = [1.0, 1.7] as const; // arrives, centered
export const ACT1_SETTLE = [1.8, 2.6] as const; // title rises, two cards appear
export const ACT1_OUT = [2.8, 3.4] as const; // leaves

// Theme shifts dark → light entering the student section.
export const THEME_LIGHT = [3.3, 3.95] as const;

// Act 2 — "En tant qu'étudiant :" + 3 skill offerings (gated).
export const ACT2_IN = [3.5, 4.0] as const;
export const ACT2_OUT = [5.0, 5.6] as const;
export const GATE_U = 4.0; // scroll cannot pass this until a skill is chosen

// Act 3 — weekly planning + the Thursday 11:00 session.
export const ACT3_IN = [4.9, 5.6] as const;
export const ACT3_SESSION = [5.4, 6.2] as const;
export const ACT3_OUT = [6.6, 7.2] as const;

// Act 4 — chosen card reappears with a green check (course done).
export const ACT4_IN = [6.8, 7.4] as const;
export const ACT4_CHECK = [7.3, 7.9] as const;
export const ACT4_OUT = [8.2, 8.8] as const;

// Act 5 — review the course and the tutor (5 stars each).
export const ACT5_IN = [8.4, 9.0] as const;
export const ACT5_OUT = [9.8, 10.4] as const;

// Theme shifts light → dark again entering the tutor section.
export const THEME_DARK = [9.8, 10.5] as const;

// Act 6 — "En tant que tuteur :".
export const ACT6_IN = [10.2, 10.9] as const;

// End of the story → the portal auto-closes here.
export const TOTAL_U = 11.4;

/** Eased 0→1 progress of `u` across a [start, end] range. */
export function seg(u: number, range: readonly [number, number]): number {
  return smootherstep(range[0], range[1], u);
}
