import { WORDS } from "./words.js";

const MULTIPLE = /^(\d+(?:\.\d+)?)\s*[×x]$/i;

/**
 * What screen readers hear after a model's name for its `cost`: ", 3 times the cost" for "3×", ", the same cost" for
 * "1×", else the cost as written (", Free", ", $0.40"). Model Selector's and Model Control's `costName` replaces it.
 */
export function costName(cost: string): string {
  const multiple = MULTIPLE.exec(cost.trim());
  if (!multiple) return `, ${cost}`;
  const times = Number(multiple[1]);
  return times === 1 ? `, ${WORDS.sameCost}` : `, ${multiple[1]} ${WORDS.timesTheCost}`;
}

/** The footer note under a model list: `costNote` as given (empty hides it), else the default while any model has a cost. */
export const costNoteOf = (costNote: string | undefined, models: readonly { cost?: string }[]): string =>
  costNote ?? (models.some((model) => model.cost) ? WORDS.costNote : "");
