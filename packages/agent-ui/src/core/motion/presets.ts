export type MotionMode = "auto" | "reduced" | "none";
export type MotionPreset = "fade" | "fade-up" | "expand" | "dot-flow";
export type ResolvedMotion = "full" | "reduced" | "none";

/** Staggered fade that flows across loading dots, never synchronized blinking. */
export const DOT_FLOW = { selector: "[data-dot]", duration: 1.2, stagger: 0.15, dim: 0.3 } as const;

/** `"auto"` follows `prefers-reduced-motion`. */
export function resolveMotion(mode: MotionMode, prefersReduced: boolean): ResolvedMotion {
  if (mode === "none" || mode === "reduced") return mode;
  return prefersReduced ? "reduced" : "full";
}

export type Frame = { opacity: number; transform?: string };

const HIDDEN: Record<MotionPreset, Frame> = {
  fade: { opacity: 0 },
  "fade-up": { opacity: 0, transform: "translateY(8px)" },
  expand: { opacity: 0 },
  "dot-flow": { opacity: 0 },
};

const SHOWN: Record<MotionPreset, Frame> = {
  fade: { opacity: 1 },
  "fade-up": { opacity: 1, transform: "none" },
  expand: { opacity: 1 },
  "dot-flow": { opacity: 1 },
};

/** Hidden then shown, for an entrance. `expand` also animates height, which the helper measures. */
export function fullKeyframes(preset: MotionPreset): [Frame, Frame] {
  return [{ ...HIDDEN[preset] }, { ...SHOWN[preset] }];
}

/** The reduced version of every preset: an opacity fade only, with no translate, scale, or height. */
export function reducedKeyframes(preset: MotionPreset): [Frame, Frame] {
  return [{ opacity: HIDDEN[preset].opacity }, { opacity: SHOWN[preset].opacity }];
}
