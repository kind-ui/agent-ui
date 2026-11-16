import { animateIn, animateOut } from "@ui-sdk/core";
import { type AnimationPlaybackControls, animate, type DOMKeyframesDefinition, frame, stagger } from "motion";
import {
  DOT_FLOW,
  type Frame,
  fullKeyframes,
  type MotionMode,
  type MotionPreset,
  type ResolvedMotion,
  reducedKeyframes,
  resolveMotion,
} from "./presets.js";
import { DURATION, EASE, SPRING } from "./tokens.js";

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
  /** CSS properties the run animates, held at their current values when it is interrupted. */
  properties: string[];
  /** Ends the run's promise: resolves an enter or layout, rejects an exit with `AbortError`. */
  interrupt: () => void;
}

// motion replaces a running animation of the same property, so presets move with `transform`, which
// stays on the compositor, and layout with the `translate` and `scale` properties, tracked apart.
const running = new WeakMap<HTMLElement, Run>();
const layouts = new WeakMap<HTMLElement, Run>();
const presence = new WeakMap<HTMLElement, () => void>();
const exits = new WeakMap<HTMLElement, Promise<void>>();
const loops = new WeakMap<HTMLElement, AnimationPlaybackControls>();

const ANIMATED = ["opacity", "transform", "height", "overflow"] as const;
const LAYOUT = ["translate", "scale", "transform-origin"] as const;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** What `motion` resolves to on this page: `"auto"` follows `prefers-reduced-motion`. */
export function resolvedMotion(motion: MotionMode = "auto"): ResolvedMotion {
  return resolveMotion(motion, typeof matchMedia === "function" && matchMedia(REDUCED_QUERY).matches);
}

/** Calls `listener` when the person turns reduced motion on or off. Returns a cleanup. */
export function onReducedMotionChange(listener: () => void): () => void {
  if (typeof matchMedia !== "function") return () => {};
  const query = matchMedia(REDUCED_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function modeOf(options: MotionOptions | undefined): ResolvedMotion {
  return resolvedMotion(options?.motion);
}

/**
 * Cancels the run tracked for `el`; with `hold`, its properties stay inline at their current values.
 * motion's `stop()` would commit them a frame later, over whatever runs next.
 */
function stop(runs: WeakMap<HTMLElement, Run>, el: HTMLElement, hold: boolean): boolean {
  const run = runs.get(el);
  if (!run) return false;
  runs.delete(el);
  const style = getComputedStyle(el);
  const held = hold ? run.properties.map((name) => [name, style.getPropertyValue(name)] as const) : [];
  run.controls.cancel();
  for (const [property, value] of held) el.style.setProperty(property, value);
  run.interrupt();
  return true;
}

/** Stops an enter or exit, and its presence. Returns whether one was running. */
function interrupt(el: HTMLElement, hold: boolean): boolean {
  exits.delete(el);
  presence.get(el)?.();
  presence.delete(el);
  return stop(running, el, hold);
}

function stopLoop(el: HTMLElement): void {
  // `cancel`, not `stop`: motion's `stop()` writes the current opacity back a frame later.
  loops.get(el)?.cancel();
  loops.delete(el);
  for (const dot of el.querySelectorAll<HTMLElement>(DOT_FLOW.selector)) dot.style.removeProperty("opacity");
}

function clearStyles(el: HTMLElement, properties: readonly string[] = ANIMATED): void {
  for (const property of properties) el.style.removeProperty(property);
}

// `scrollHeight` covers content and padding only; the `height` it becomes depends on `box-sizing`.
function naturalHeight(el: HTMLElement): string {
  const style = getComputedStyle(el);
  const px = Number.parseFloat;
  const height =
    style.boxSizing === "border-box"
      ? el.scrollHeight + px(style.borderTopWidth) + px(style.borderBottomWidth)
      : el.scrollHeight - px(style.paddingTop) - px(style.paddingBottom);
  return `${height}px`;
}

// Explicit `[from, to]` keyframes start motion's WAAPI animation at once, so UI SDK `animateOut`
// sees it running and waits for it. When continuing, `from` is the current computed value.
function definitionFor(
  el: HTMLElement,
  preset: MotionPreset,
  mode: "full" | "reduced",
  direction: "in" | "out",
  reversing: boolean,
): DOMKeyframesDefinition {
  const frames = mode === "full" ? fullKeyframes(preset) : reducedKeyframes(preset);
  const [from, to] = direction === "in" ? frames : [frames[1], frames[0]];
  const fromCurrent = reversing || direction === "out";
  const current = fromCurrent ? getComputedStyle(el) : undefined;
  const definition: Record<string, unknown> = {};
  for (const key of Object.keys(to) as (keyof Frame)[]) {
    const value = to[key];
    const now = current?.getPropertyValue(key);
    let start = from[key];
    if (now !== undefined) start = typeof value === "number" ? Number.parseFloat(now) : now;
    definition[key] = [start, value];
  }
  if (preset === "expand" && mode === "full") {
    const height = getComputedStyle(el).height;
    el.style.overflow = "hidden";
    definition.height = [fromCurrent ? height : "0px", direction === "in" ? naturalHeight(el) : "0px"];
  }
  return definition as DOMKeyframesDefinition;
}

/** Tracks `controls` for `el`. Resolves `true` when it finishes, `false` when interrupted. */
function track(
  el: HTMLElement,
  controls: AnimationPlaybackControls,
  properties: string[],
  runs: WeakMap<HTMLElement, Run>,
): Promise<boolean> {
  return new Promise((resolve) => {
    const entry: Run = { controls, properties, interrupt: () => resolve(false) };
    runs.set(el, entry);
    controls.finished.then(
      () => {
        if (runs.get(el) !== entry) return;
        runs.delete(el);
        // motion writes the end value in its next render step; resolving after it lets cleanup win.
        frame.render(() => resolve(true));
      },
      () => resolve(false),
    );
  });
}

function run(
  el: HTMLElement,
  definition: DOMKeyframesDefinition,
  mode: "full" | "reduced",
): Promise<boolean> {
  const transition = mode === "full" ? SPRING : { duration: DURATION.reduced, ease: EASE.out };
  return track(el, animate(el, definition, transition), Object.keys(definition), running);
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
  const reversing = interrupt(el, mode !== "none");
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
  const fromCurrent = interrupt(el, mode !== "none");
  if (mode === "none") {
    stopLoop(el);
    clearStyles(el);
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
 * where it is now, on the `translate` and `scale` properties, so it runs alongside `enter` and `exit`.
 * Reduced motion and `"none"` apply the new layout at once, with no translate or scale.
 */
export function layout(el: HTMLElement, measureBefore: DOMRect, options?: MotionOptions): Promise<void> {
  const mode = modeOf(options);
  stop(layouts, el, false);
  clearStyles(el, LAYOUT);
  if (mode !== "full") return Promise.resolve();
  const after = el.getBoundingClientRect();
  const dx = measureBefore.left - after.left;
  const dy = measureBefore.top - after.top;
  const sx = after.width > 0 ? measureBefore.width / after.width : 1;
  const sy = after.height > 0 ? measureBefore.height / after.height : 1;
  if (dx === 0 && dy === 0 && sx === 1 && sy === 1) return Promise.resolve();
  el.style.transformOrigin = "top left";
  const invert = (left: number) => {
    el.style.translate = `${dx * left}px ${dy * left}px`;
    el.style.scale = `${1 + (sx - 1) * left} ${1 + (sy - 1) * left}`;
  };
  // motion's first update comes a frame later, so the element starts where it was in the frame it moved.
  invert(1);
  const controls = animate(1, 0, { ...SPRING, onUpdate: invert });
  return track(el, controls, [...LAYOUT], layouts).then((finished) => {
    if (finished) clearStyles(el, LAYOUT);
  });
}

/** Stops `el`'s enter, exit and `"dot-flow"` loop at once and clears their styles, for a part that unbinds. */
export function cancel(el: HTMLElement): void {
  interrupt(el, false);
  stopLoop(el);
  clearStyles(el);
}

/**
 * Starts or stops `el`'s `"dot-flow"` loop for `motion` without playing its entrance again, for a motion change
 * after `enter`. Reduced motion and `"none"` hold the dots still.
 */
export function flow(el: HTMLElement, options?: MotionOptions): void {
  stopLoop(el);
  if (modeOf(options) === "full") startLoop(el);
}
