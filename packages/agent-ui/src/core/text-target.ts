import type { ChangeSource } from "@ui-sdk/core";

type Insert = (text: string, source: ChangeSource) => boolean;

/** Elements that take text another component produces, like a Composer's root taking dictated text. */
const targets = new WeakMap<Element, Insert>();

/** Makes `el` take text through `insert`, which returns whether it did. Returns a cleanup. */
export const bindTextTarget = (el: Element, insert: Insert): (() => void) => {
  targets.set(el, insert);
  return () => {
    if (targets.get(el) === insert) targets.delete(el);
  };
};

/** Hands `text`, caused by `source`, to the nearest target around `el`, and returns whether one took it. */
export const insertText = (el: Element | undefined, text: string, source: ChangeSource): boolean => {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const insert = targets.get(node);
    if (insert) return insert(text, source);
  }
  return false;
};
