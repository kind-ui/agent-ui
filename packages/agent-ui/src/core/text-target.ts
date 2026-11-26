import type { ChangeSource } from "@ui-sdk/core";

/** `"dictation"` adds text after a space; `"queue-edit"` takes back a queued or withdrawn message, after a line break. */
export type TextInsertReason = "dictation" | "queue-edit";

type Insert = (text: string, source: ChangeSource, reason: TextInsertReason) => boolean;

/** What a target tells a source docked inside it: whether a turn runs, or `null` once it's no longer docked. */
export type TextSourceLink = {
  /** Takes back the last item, handing its text to the target. Returns whether there was one. */
  takeBack: (source: ChangeSource) => boolean;
  dock: (running: boolean | null) => void;
};

/** Elements that take text another component produces, like a Composer's root taking dictated text. */
const targets = new Map<Element, { insert: Insert; running: () => boolean; accepts: () => boolean }>();
/** Elements that hand text back to the target around them, like a Queue docked in a Composer. */
const sources = new Map<Element, TextSourceLink>();

const targetAround = (el: Element | undefined) => {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const target = targets.get(node);
    if (target) return target;
  }
  return undefined;
};

/**
 * Makes `el` take text through `insert`, which returns whether it did, and docks the sources inside it. Call the
 * returned `update` when `running` changes; `cleanup` undocks them.
 */
export const bindTextTarget = (
  el: Element,
  insert: Insert,
  running: () => boolean = () => false,
  accepts: () => boolean = () => true,
) => {
  const target = { insert, running, accepts };
  targets.set(el, target);
  const inside = () =>
    [...sources].filter(([source]) => el.contains(source) && targetAround(source) === target);
  for (const [, link] of inside()) link.dock(running());
  return {
    update: () => {
      for (const [, link] of inside()) link.dock(running());
    },
    cleanup: () => {
      for (const [, link] of inside()) link.dock(null);
      if (targets.get(el) === target) targets.delete(el);
    },
  };
};

/** Hands `text`, caused by `source`, to the nearest target around `el`, and returns whether one took it. */
export const insertText = (
  el: Element | undefined,
  text: string,
  source: ChangeSource,
  reason: TextInsertReason = "dictation",
): boolean => targetAround(el)?.insert(text, source, reason) ?? false;

/**
 * The nearest target around `el`, else the first target inside the nearest ancestor that holds one, like the Composer
 * beside a Conversation whose message gives its text back. Climbs through `parentNode`, so a shadow root holding both
 * counts. Read it while `el` is in the page; the returned `insert` works after `el` leaves.
 */
export const textTargetNearby = (el: Element | undefined): Insert | undefined => {
  const around = targetAround(el);
  if (around) return around.insert;
  for (let node: Node | null | undefined = el?.parentNode; node; node = node.parentNode) {
    for (const [target, { insert }] of targets) if (node.contains(target)) return insert;
  }
  return undefined;
};

/** Hands `text` to `textTargetNearby(el)`, and returns whether one took it. */
export const insertTextNearby = (
  el: Element | undefined,
  text: string,
  source: ChangeSource,
  reason: TextInsertReason,
): boolean => textTargetNearby(el)?.(text, source, reason) ?? false;

/** Whether a target around `el` would take text now, so a source can keep its item until one does. */
export const canInsertText = (el: Element | undefined): boolean => targetAround(el)?.accepts() ?? false;

/** Registers `el` as a source and docks it in the target around it, if any. Returns a cleanup. */
export const bindTextSource = (el: Element, link: TextSourceLink): (() => void) => {
  sources.set(el, link);
  const target = targetAround(el);
  if (target) link.dock(target.running());
  return () => {
    if (sources.get(el) === link) sources.delete(el);
    link.dock(null);
  };
};

/** Takes back the last item of the first source docked inside `el`. Returns whether there was one. */
export const takeBackText = (el: Element, source: ChangeSource): boolean => {
  const target = targets.get(el);
  if (!target) return false;
  for (const [node, link] of sources) {
    if (el.contains(node) && targetAround(node) === target) return link.takeBack(source);
  }
  return false;
};
