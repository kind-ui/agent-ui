import type { ChangeSource } from "@ui-sdk/core";

/** `"dictation"` adds text after a space; `"queue-edit"` takes back a queued message, after a line break. */
export type TextInsertReason = "dictation" | "queue-edit";

type Insert = (text: string, source: ChangeSource, reason: TextInsertReason) => boolean;

/** What a target tells a source docked inside it: whether a turn runs, or `null` once it's no longer docked. */
export type TextSourceLink = {
  /** Takes back the last item, handing its text to the target. Returns whether there was one. */
  takeBack: (source: ChangeSource) => boolean;
  dock: (running: boolean | null) => void;
};

/** Elements that take text another component produces, like a Composer's root taking dictated text. */
const targets = new WeakMap<Element, { insert: Insert; running: () => boolean }>();
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
export const bindTextTarget = (el: Element, insert: Insert, running: () => boolean = () => false) => {
  const target = { insert, running };
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
