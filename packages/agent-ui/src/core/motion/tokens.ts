/**
 * Motion tokens, in seconds. `agent-ui.css` mirrors them as `--kind-duration-*` and `--kind-ease*`
 * for CSS motion; `tests/core/motion.test.mjs` fails when the two differ.
 */
export const DURATION = { fast: 0.15, base: 0.2, panel: 0.28, reduced: 0.12 } as const;

/** Cubic-bezier control points. `out` is CSS `ease-out` and motion's `"easeOut"`. */
export const EASE = {
  standard: [0.2, 0.8, 0.2, 1],
  out: [0, 0, 0.58, 1],
  /** Overshoots a little and settles, for a small part that answers a press, like a slider's thumb. */
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/** Full-motion spring for the helper. It settles in `DURATION.panel`, the CSS panel height transition. */
export const SPRING = { type: "spring", visualDuration: DURATION.panel, bounce: 0 } as const;
