import type { Budgets } from "./react.js";

// Solid's count budgets (plan D12), measured on Linux CI. Solid has no component re-render, so its budgets
// are `writes`, `layoutReads` and `parses` only. Each track task adds the cases it measures below its own
// marker; `budgets.spec.ts` skips a case with no entry here.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export const budgets: Partial<Budgets> = {
  // framework-solid-1: groundwork, internal wrappers and Step

  // framework-solid-2: chat core

  // framework-solid-3: composer controls

  contextChip: { writes: 5, renders: 0, notified: 0, layoutReads: 0 },

  // framework-solid-4: indicators, notices and files

  // framework-solid-5: step family

  // framework-solid-6: developer output

  // framework-solid-7: Wave 6 shell

  // framework-solid-8: conformance
};
