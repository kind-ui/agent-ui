import type { Budgets } from "./react.js";

// Svelte's count budgets (plan D12), measured on Linux CI. Svelte has no component re-render, so its budgets
// are `writes`, `layoutReads` and `parses` only. Each track task adds the cases it measures below its own
// marker; `budgets.spec.ts` skips a case with no entry here.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export const budgets: Partial<Budgets> = {
  // framework-svelte-1: groundwork, internal wrappers and Step

  // framework-svelte-2: chat core

  conversationStream: { writes: 1, renders: 0, notified: 1 },
  conversationFollow: { layoutReads: 12 },
  remount: { nodes: 0, listeners: 0 },
  // A chunk rewrites the streaming block's last text node and its `data-block-key`.
  markdownStream: { parses: 1, writes: 2, renders: 0, notified: 1 },

  // framework-svelte-3: composer controls

  // framework-svelte-4: indicators, notices and files

  // framework-svelte-5: step family

  // The first chunk also rewrites 10 unchanged `style` attributes on the Code Block's `pre` and scroll area parts:
  // `@ui-sdk/svelte` hands Svelte each part's current inline style, which Svelte compares with the last style it
  // wrote, not the element's. Later chunks write 1.
  toolStream: { writes: 16, renders: 0, notified: 16 },

  // framework-svelte-6: developer output

  // framework-svelte-7: Wave 6 shell

  // framework-svelte-8: conformance
};
