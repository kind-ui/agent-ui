import { cellsToText, definePrimitive, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createCopy } from "../clipboard.js";

export type MarkdownTableState = { copied: boolean };

export type MarkdownTableApi = {
  /** Copies the table as tab-separated text, a row per line. */
  copy: () => Promise<boolean>;
};

type MarkdownTableSlot = SlotDefinition<
  MarkdownTableState,
  MarkdownTableApi,
  BaseSlotProps,
  Record<never, never>
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type MarkdownTablePrimitive = ReturnType<
  typeof definePrimitive<
    Record<never, never>,
    MarkdownTableState,
    MarkdownTableApi,
    Record<"root" | "header" | "copy" | "table", MarkdownTableSlot>
  >
>;

export const markdownTablePrimitive: MarkdownTablePrimitive = definePrimitive({
  name: "kind-markdown-table",
  state: (): MarkdownTableState => ({ copied: false }),
  api: (context): MarkdownTableApi => {
    const copy = createCopy(context);
    return {
      copy: () => {
        const table = context.element("table") as HTMLTableElement | undefined;
        const rows = [...(table?.rows ?? [])].map((row) =>
          [...row.cells].map((cell) => cell.textContent?.trim() ?? ""),
        );
        return copy(cellsToText(rows));
      },
    };
  },
  slots: (slot) => ({
    root: slot({ role: "group" }),
    header: slot({}),
    copy: slot({
      role: "button",
      focus: "native",
      press: ({ api }) => void api.copy(),
      attrs: (state) => ({
        type: "button",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
        "aria-label": "Copy table",
        "data-copied": state.copied ? "" : undefined,
      }),
    }),
    table: slot({}),
  }),
  agent: { actions: ["copy"] },
});
