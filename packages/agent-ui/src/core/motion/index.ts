import { animateIn, animateOut } from "@ui-sdk/core";
import { type AnimationPlaybackControls, animate, type DOMKeyframesDefinition, stagger } from "motion";
import {
  DOT_FLOW,
  fullKeyframes,
  type MotionMode,
  type MotionPreset,
  REDUCED_DURATION,
  type ResolvedMotion,
  reducedKeyframes,
  resolveMotion,
  SPRING,
} from "./presets.js";

export {
  type MotionMode,
  type MotionPreset,
  type ResolvedMotion,
  reducedKeyframes,
  resolveMotion,
} from "./presets.js";

export interface MotionOptions {
  /** Defaults to `"auto"`, which follows `prefers-reduced-motion`. */
  motion?: MotionMode;
}

interface Run {
  controls: AnimationPlaybackControls;
  /** Ends the run's promise: resolves an enter or layout, rejects an exit with `AbortError`. */
  interrupt: () => void;
}

/** The value animation running on each element. A new `enter`, `exit`, or `layout` starts from its current value. */
const running = new WeakMap<HTMLElement, Run>();
/** UI SDK presence cleanup (`animateIn` / `animateOut`) for each element. */
const presence = new WeakMap<HTMLElement, () => void>();
const exits = new WeakMap<HTMLElement, Promise<void>>();
const loops = new WeakMap<HTMLElement, AnimationPlaybackControls>();

const ANIMATED = ["opacity", "transform", "height", "overflow", "transform-origin"] as const;

function prefersReduced(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function modeOf(options: MotionOptions | undefined): ResolvedMotion {
  return resolveMotion(options?.motion ?? "auto", prefersReduced());
}

/** Stops whatever is animating `el` at its current value. Returns whether something was. */
function interrupt(el: HTMLElement): boolean {
  const run = running.get(el);
  running.delete(el);
  exits.delete(el);
  presence.get(el)?.();
  presence.delete(el);
  run?.controls.stop();
  run?.interrupt();
  return run !== undefined;
}

function stopLoop(el: HTMLElement): void {
  loops.get(el)?.stop();
  loops.delete(el);
  for (const dot of el.querySelectorAll<HTMLElement>(DOT_FLOW.selector)) dot.style.removeProperty("opacity");
}

function clearStyles(el: HTMLElement): void {
  for (const property of ANIMATED) el.style.removeProperty(property);
}

/**
 * `[from, to]` keyframes as motion's value map. When continuing, `from` is the current computed
 * value. Explicit keyframes let motion start its WAAPI animation at once, so UI SDK `animateOut`
 * sees it running and waits for it.
 */
function definitionFor(
  el: HTMLElement,
  preset: MotionPreset,
  mode: "full" | "reduced",
  direction: "in" | "out",
  reversing: boolean,
): DOMKeyframesDefinition {
  const frames = mode === "full" ? fullKeyframes(preset) : reducedKeyframes(preset);
  const [from = {}, to = {}] = direction === "in" ? frames : [...frames].reverse();
  const fromCurrent = reversing || direction === "out";
  const current = fromCurrent ? getComputedStyle(el) : undefined;
  const definition: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(to)) {
    if (key === "offset" || key === "easing" || key === "composite") continue;
    const now = current?.getPropertyValue(key);
    definition[key] = [
      now === undefined ? from[key] : typeof value === "number" ? Number.parseFloat(now) : now,
      value,
    ];
  }
  if (preset === "expand" && mode === "full") {
    const height = `${el.getBoundingClientRect().height}px`;
    el.style.overflow = "hidden";
    definition.height = [fromCurrent ? height : "0px", direction === "in" ? `${el.scrollHeight}px` : "0px"];
  }
  return definition as DOMKeyframesDefinition;
}

/** Runs `definition` on `el` and tracks it. Resolves `true` when it finishes, `false` when interrupted. */
function run(
  el: HTMLElement,
  definition: DOMKeyframesDefinition,
  mode: "full" | "reduced",
): Promise<boolean> {
  const transition = mode === "full" ? SPRING : { duration: REDUCED_DURATION, ease: "easeOut" as const };
  return new Promise((resolve) => {
    const controls = animate(el, definition, transition);
    const entry: Run = { controls, interrupt: () => resolve(false) };
    running.set(el, entry);
    controls.finished.then(
      () => {
        if (running.get(el) !== entry) return;
        running.delete(el);
        resolve(true);
      },
      () => resolve(false),
    );
  });
}

function startLoop(el: HTMLElement): void {
  const dots = [...el.querySelectorAll<HTMLElement>(DOT_FLOW.selector)];
  if (dots.length === 0) return;
  loops.set(
    el,
    animate(
      dots,
      { opacity: [DOT_FLOW.dim, 1, DOT_FLOW.dim] },
      {
        duration: DOT_FLOW.duration,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        delay: stagger(DOT_FLOW.stagger),
      },
    ),
  );
}

/**
 * Animates `el` in. Call it from a part's `bind` (or on mount) with UI SDK presence: this applies
 * `animateIn`'s `data-starting-style`. During a running `exit`, it reverses from the current value.
 * `"dot-flow"` starts a staggered loop over `[data-dot]` children; the promise resolves once the
 * container has entered, and the loop runs until `exit`.
 */
export function enter(el: HTMLElement, preset: MotionPreset, options?: MotionOptions): Promise<void> {
  const mode = modeOf(options);
  const reversing = interrupt(el);
  if (preset === "dot-flow") stopLoop(el);
  if (mode === "none") {
    clearStyles(el);
    return Promise.resolve();
  }
  presence.set(el, animateIn(el));
  if (preset === "dot-flow" && mode === "full") startLoop(el);
  return run(el, definitionFor(el, preset, mode, "in", reversing), mode).then((finished) => {
    if (!finished) return;
    presence.delete(el);
    clearStyles(el);
  });
}

/**
 * Animates `el` out and resolves once it may unmount. Presence uses UI SDK `animateOut`
 * (`data-ending-style` and `inert` while leaving). Calling `exit` again returns the same promise.
 * An `enter` during the exit rejects it with an `AbortError`: the element stays.
 */
export function exit(el: HTMLElement, preset: MotionPreset, options?: MotionOptions): Promise<void> {
  const pending = exits.get(el);
  if (pending) return pending;
  const mode = modeOf(options);
  const fromCurrent = interrupt(el);
  if (mode === "none") {
    stopLoop(el);
    el.style.opacity = "0";
    return Promise.resolve();
  }
  const animation = run(el, definitionFor(el, preset, mode, "out", fromCurrent), mode);
  const promise = new Promise<void>((resolve, reject) => {
    const left = new Promise<void>((done) => presence.set(el, animateOut(el, done)));
    const aborted = () => reject(new DOMException("exit interrupted by enter", "AbortError"));
    void animation.then((finished) => {
      if (!finished) return aborted();
      void left.then(() => {
        if (exits.get(el) !== promise) return;
        exits.delete(el);
        presence.delete(el);
        stopLoop(el);
        resolve();
      });
    });
  });
  exits.set(el, promise);
  return promise;
}

/**
 * FLIP: animates `el` from `measureBefore` (its `getBoundingClientRect()` before the change) to
 * where it is now. Reduced motion and `"none"` apply the new layout at once, with no translate or scale.
 */
export function layout(el: HTMLElement, measureBefore: DOMRect, options?: MotionOptions): Promise<void> {
  const mode = modeOf(options);
  interrupt(el);
  el.style.removeProperty("transform");
  if (mode !== "full") return Promise.resolve();
  const after = el.getBoundingClientRect();
  const dx = measureBefore.left - after.left;
  const dy = measureBefore.top - after.top;
  const sx = after.width > 0 ? measureBefore.width / after.width : 1;
  const sy = after.height > 0 ? measureBefore.height / after.height : 1;
  if (dx === 0 && dy === 0 && sx === 1 && sy === 1) return Promise.resolve();
  el.style.transformOrigin = "top left";
  const from = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  return run(el, { transform: [from, "none"] } as DOMKeyframesDefinition, mode).then((finished) => {
    if (!finished) return;
    el.style.removeProperty("transform");
    el.style.removeProperty("transform-origin");
  });
}
