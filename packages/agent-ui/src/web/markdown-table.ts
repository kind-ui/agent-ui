import { markdownTablePrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import { defineInternalScrollArea } from "./internal/scroll-area.js";

const parts = `
  <kind-markdown-table-header>
    <kind-markdown-table-copy><button></button></kind-markdown-table-copy>
  </kind-markdown-table-header>
  <kind-internal-scroll-area>
    <ui-scroll-area>
      <ui-scroll-area-viewport><ui-scroll-area-content><kind-markdown-table-table></kind-markdown-table-table></ui-scroll-area-content></ui-scroll-area-viewport>
      <ui-scroll-area-scrollbar orientation="horizontal"><ui-scroll-area-thumb></ui-scroll-area-thumb></ui-scroll-area-scrollbar>
    </ui-scroll-area>
  </kind-internal-scroll-area>`;

/**
 * `<kind-markdown-table aria-label="Table"><table>…</table></kind-markdown-table>` moves its table into a
 * scroll area beside a copy button, unless those parts are already written. Set `--kind-markdown-table-columns`
 * to the column count so it scrolls sideways rather than squeezing its columns.
 */
export function defineMarkdownTable(): void {
  if (customElements.get("kind-markdown-table")) return;
  defineInternalScrollArea();
  createParts(markdownTablePrimitive, {
    root: {
      tag: "kind-markdown-table",
      api: ["copy"],
      render: (el) => {
        if (el.querySelector("kind-markdown-table-table")) return;
        const table = el.querySelector("table");
        el.innerHTML = parts;
        if (table) el.querySelector("kind-markdown-table-table")?.append(table);
      },
    },
    header: "kind-markdown-table-header",
    copy: { tag: "kind-markdown-table-copy", target: wrappedButton, display: "contents" },
    table: { tag: "kind-markdown-table-table", target: wrappedChild("table"), display: "contents" },
  });
}
