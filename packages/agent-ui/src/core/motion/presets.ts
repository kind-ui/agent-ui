export type MotionMode = "auto" | "reduced" | "none";
export type MotionPreset = "fade" | "fade-up" | "expand" | "dot-flow";
export type ResolvedMotion = "full" | "reduced" | "none";

/** Longest animation allowed under reduced motion, in seconds (spec §6). */
export const REDUCED_DURATION = 0.12;

export const SPRING = { type: "spring", visualDuration: 0.28, bounce: 0 } as const;

/** Staggered fade that flows across loading dots, never synchronized blinking. */
export const DOT_FLOW = { selector: "[data-dot]", duration: 1.2, stagger: 0.16, dim: 0.3 } as const;

/** `"auto"` follows `prefers-reduced-motion`. */
export function resolveMotion(mode: MotionMode, prefersReduced: boolean): ResolvedMotion {
  if (mode === "none" || mode === "reduced") return mode;
  return prefersReduced ? "reduced" : "full";
}

const HIDDEN: Record<MotionPreset, Keyframe> = {
  fade: { opacity: 0 },
  "fade-up": { opacity: 0, transform: "translateY(8px)" },
  expand: { opacity: 0 },
  "dot-flow": { opacity: 0 },
};

const SHOWN: Record<MotionPreset, Keyframe> = {
  fade: { opacity: 1 },
  "fade-up": { opacity: 1, transform: "none" },
  expand: { opacity: 1 },
  "dot-flow": { opacity: 1 },
};

/** Hidden then shown, for an entrance. `expand` also animates height, which the helper measures. */
export function fullKeyframes(preset: MotionPreset): Keyframe[] {
  return [{ ...HIDDEN[preset] }, { ...SHOWN[preset] }];
}

/** The reduced version of every preset: an opacity fade only, with no translate, scale, or height. */
export function reducedKeyframes(preset: MotionPreset): Keyframe[] {
  return [{ opacity: HIDDEN[preset].opacity ?? 0 }, { opacity: SHOWN[preset].opacity ?? 1 }];
}
