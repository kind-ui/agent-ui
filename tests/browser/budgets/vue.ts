import type { Budgets } from "./react.js";

// Vue's count budgets (plan D12), measured on Linux CI. Its `renders` are component updates through Vue's
// DevTools hook. Each track task adds the cases it measures below its own marker; `budgets.spec.ts` skips a
// case with no entry here.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export const budgets: Partial<Budgets> = {
  // framework-vue-1: groundwork, internal wrappers and Step

  // framework-vue-2: chat core

  // framework-vue-3: composer controls

  // framework-vue-4: indicators, notices and files

  // framework-vue-5: step family

  // framework-vue-6: developer output

  // framework-vue-7: Wave 6 shell

  // framework-vue-8: conformance
};
