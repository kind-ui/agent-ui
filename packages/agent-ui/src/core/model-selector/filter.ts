import { fuzzyScore } from "@ui-sdk/core/text-match";
import type { ModelOption } from "../../types/index.js";

/** Models that share a `group`, or have none. */
export type ModelGroup = { group: string | undefined; models: ModelOption[] };

const scoreOf = (model: ModelOption, query: string) =>
  Math.max(
    fuzzyScore(model.name, query),
    model.group ? fuzzyScore(model.group, query) : 0,
    model.description ? fuzzyScore(model.description, query) : 0,
  );

/**
 * The models that match `query`, grouped by `group` in the order groups first appear. Within a group, the best match
 * by `fuzzyScore` over name, group and description comes first; models that don't match are left out. An empty query
 * keeps every model in order.
 */
export function filterModels(models: ModelOption[], query: string): ModelGroup[] {
  const groups = new Map<string | undefined, { model: ModelOption; score: number }[]>();
  for (const model of models) {
    const ranked = groups.get(model.group) ?? [];
    groups.set(model.group, ranked);
    const score = query ? scoreOf(model, query) : 1;
    if (score > 0) ranked.push({ model, score });
  }
  return [...groups]
    .filter(([, ranked]) => ranked.length > 0)
    .map(([group, ranked]) => ({
      group,
      models: ranked.sort((a, b) => b.score - a.score).map(({ model }) => model),
    }));
}
