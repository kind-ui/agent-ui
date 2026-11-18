/** Elements that take text another component produces, like a Composer's root taking dictated text. */
const targets = new WeakMap<Element, (text: string) => boolean>();

/** Makes `el` take text through `insert`, which returns whether it did. Returns a cleanup. */
export const bindTextTarget = (el: Element, insert: (text: string) => boolean): (() => void) => {
  targets.set(el, insert);
  return () => {
    if (targets.get(el) === insert) targets.delete(el);
  };
};

/** Hands `text` to the nearest target around `el`, and returns whether one took it. */
export const insertText = (el: Element | undefined, text: string): boolean => {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const insert = targets.get(node);
    if (insert) return insert(text);
  }
  return false;
};
