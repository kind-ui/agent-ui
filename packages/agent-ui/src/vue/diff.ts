import { type DiffPiece, type DiffRow as DiffRowData, diffPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(diffPrimitive, {
  root: "figure",
  header: "div",
  path: "span",
  status: "span",
  stats: "span",
  copy: "button",
  accept: "button",
  revert: "button",
  viewport: "div",
  table: "div",
  row: "div",
  "old-number": "span",
  "new-number": "span",
  sign: "span",
  code: "span",
  collapsed: "button",
  "collapsed-text": "span",
});

// `$stable` tells Vue these slots never change, so a part that renders again doesn't render the parts inside it.
const stable = (slot: () => unknown) => ({ default: slot, $stable: true });

// A part that fills an empty default slot from its state.
const withDefault = <Part>(part: Part, name: string, fill: (state: never) => unknown) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part as never, attrs, {
          ...slots,
          default: slots.default ?? (({ state }: { state: never }) => fill(state)),
        });
    },
  }) as unknown as Part;

/** Holds the path, status, stats and actions. */
export const DiffHeader = parts.Header;
export const DiffCopy = parts.Copy;
/** Scrolls the lines. Holds a `DiffTable`. */
export const DiffViewport = parts.Viewport;

/** The path, after the old one for a rename, unless you fill the default slot. */
export const DiffPath = withDefault(
  parts.Path,
  "DiffPath",
  (state: { path: string; oldPath: string | undefined }) =>
    state.oldPath && state.oldPath !== state.path
      ? [h("span", { "data-diff-old-path": "" }, state.oldPath), state.path]
      : state.path,
);

/** "Added", "Deleted" or "Renamed", unless you fill the default slot. Absent for a modified file. */
export const DiffStatus = withDefault(parts.Status, "DiffStatus", (state: { text: string }) => state.text);

/** "+12 −3", read as "12 added, 3 removed", unless you fill the default slot. */
export const DiffStats = withDefault(parts.Stats, "DiffStats", (state: { text: string }) => state.text);

/** Present while `onAccept` is set. "Accept", unless you fill the default slot. */
export const DiffAccept = withDefault(parts.Accept, "DiffAccept", () => "Accept");

/** Present while `onRevert` is set. "Revert", unless you fill the default slot. */
export const DiffRevert = withDefault(parts.Revert, "DiffRevert", () => "Revert");

/** The line's number in the old file, unless you fill the default slot. */
export const DiffOldNumber = withDefault(
  parts.OldNumber,
  "DiffOldNumber",
  (state: { text: string }) => state.text,
);

/** The line's number in the new file, unless you fill the default slot. */
export const DiffNewNumber = withDefault(
  parts.NewNumber,
  "DiffNewNumber",
  (state: { text: string }) => state.text,
);

/** "added" or "removed", which the stylesheet shows as `+` or `−`, unless you fill the default slot. */
export const DiffSign = withDefault(parts.Sign, "DiffSign", (state: { text: string }) => state.text);

/** "Show N lines", unless you fill the default slot. */
export const DiffCollapsed = withDefault(
  parts.Collapsed,
  "DiffCollapsed",
  (state: { text: string }) => state.text,
);

/** The collapsed lines, hidden until find in page matches one, unless you fill the default slot. */
export const DiffCollapsedText = withDefault(
  parts.CollapsedText,
  "DiffCollapsedText",
  (state: { text: string }) => state.text,
);

const pieceStyle = (piece: DiffPiece) => (piece.color ? { color: piece.color } : undefined);

const pieceNode = (piece: DiffPiece, index: number) =>
  h(
    piece.changed ? "mark" : "span",
    {
      key: index,
      style: pieceStyle(piece),
      "data-italic": piece.fontStyle === "italic" ? "" : undefined,
      "data-bold": piece.fontStyle === "bold" ? "" : undefined,
    },
    piece.text,
  );

/**
 * The line's code with its changed words marked, a hunk's header, or a collapsed run's `DiffCollapsed` and
 * `DiffCollapsedText`, unless you fill the default slot.
 */
export const DiffCode = withDefault(
  parts.Code,
  "DiffCode",
  (state: { kind: DiffRowData["kind"]; text: string; pieces: readonly DiffPiece[] }) =>
    state.kind === "collapsed"
      ? [h(DiffCollapsed), h(DiffCollapsedText)]
      : state.kind === "hunk"
        ? state.text
        : state.pieces.map(pieceNode),
);

const cells = () => [h(DiffOldNumber), h(DiffNewNumber), h(DiffSign), h(DiffCode)];

/**
 * The `index`th row: its old and new numbers, its sign and its code, unless you fill the default slot. A row renders
 * again only when its own props change, so the rows that stay in view don't render again when others come in.
 */
export const DiffRow = defineComponent({
  name: "DiffRow",
  inheritAttrs: false,
  props: { index: { type: Number, required: true }, value: String },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        parts.Row,
        { ...attrs, index: props.index, value: props.value ?? String(props.index) },
        { ...slots, default: slots.default ?? cells },
      );
  },
}) as unknown as typeof parts.Row;

/** A `DiffRow` for each row in view, unless you fill the default slot. */
export const DiffTable = withDefault(
  parts.Table,
  "DiffTable",
  (state: { rows: readonly { index: number }[] }) =>
    state.rows.map((row) => h(DiffRow, { key: row.index, index: row.index })),
);

const defaultParts = () => [
  h(
    DiffHeader,
    null,
    stable(() => [h(DiffPath), h(DiffStatus), h(DiffStats), h(DiffCopy), h(DiffRevert), h(DiffAccept)]),
  ),
  h(
    DiffViewport,
    null,
    stable(() => h(DiffTable)),
  ),
];

/**
 * One file's change as a unified diff: its path, what changed in words, Copy, Accept and Revert, then its lines with
 * old and new numbers, changed words marked and long unchanged runs folded away. A default slot replaces the default
 * parts.
 */
export const Diff = defineComponent({
  name: "Diff",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
