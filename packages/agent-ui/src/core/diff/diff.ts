import {
  type ActionDetails,
  bindFindable,
  type ChangeDetails,
  createVirtualizer,
  css,
  definePrimitive,
  dispatch,
  hiddenAttrs,
  type SlotDefinition,
  selects,
  type VirtualItem,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createTwoFilesPatch } from "diff";
import type { DiffFile } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { createCopy } from "../clipboard.js";
import type { Highlight, Token } from "../code-block/code-block.js";
import { createPendingAction } from "../pending.js";
import { type DiffPiece, type DiffRow, type DiffRows, diffPieces, diffRows, tokenLines } from "./rows.js";

/** What copied the diff: the copy button, or a call to the api or an agent. */
export type DiffCopyReason = "copy-press" | "imperative";

/** What accepted or reverted the change: its button, or a call to the api or an agent. */
export type DiffActionDetails = ActionDetails & { reason: "accept-press" | "revert-press" | "imperative" };

export type DiffOptions = {
  /** The file the diff changes. A patch's own headers fill in what it leaves out. */
  file?: DiffFile;
  /**
   * A unified diff of one file, as `git diff` writes it. Pass the whole patch on each update: when it continues the
   * last one, only its last hunk is parsed again.
   */
  patch?: string;
  /** The file before the change, diffed against `after` when there's no `patch`. */
  before?: string;
  /** The file after the change. */
  after?: string;
  /** Resolves colored tokens for each side of the diff, as Code Block's does; lines show plain until it does. */
  highlight?: Highlight;
  /**
   * Whether the patch is still arriving.
   * @default false
   */
  streaming?: boolean;
  /** Offers Accept. Return a promise to keep Accept and Revert locked until it settles. */
  onAccept?: (details: DiffActionDetails) => unknown;
  /** Offers Revert. Return a promise to keep Accept and Revert locked until it settles. */
  onRevert?: (details: DiffActionDetails) => unknown;
  /** Called before the patch is copied. Cancel it to copy something else yourself. */
  onCopy?: (patch: string, details: ChangeDetails<DiffCopyReason>) => void;
  /**
   * Whether an agent needs a person to confirm its actions while Revert is offered. UI SDK marks the whole
   * component, so `accept` and `copy` need one then too.
   * @default true
   */
  agentConfirm?: boolean;
  /** Names the diff. Defaults to the file's path. */
  label?: string;
};

export type DiffState = {
  /** The `label`, else the path. */
  label: string;
  path: string;
  oldPath: string | undefined;
  status: NonNullable<DiffFile["status"]>;
  /** "Added", "Deleted" or "Renamed"; empty for a modified file. */
  statusText: string;
  added: number;
  removed: number;
  /** The diff's rows, from `patch` or `before` and `after`. */
  diff: DiffRows;
  /** The keys of the collapsed runs shown in full. */
  expanded: readonly string[];
  /** The rows as shown: each expanded run replaced by its lines. */
  display: readonly DiffRow[];
  /** Whether only the rows in view render: past 400 rows. */
  virtual: boolean;
  /** The rows to render. Each one's `start` places it while `virtual`. */
  rows: readonly VirtualItem[];
  /** The height of every row together while `virtual`, in pixels. */
  size: number;
  /** The highlighter's tokens for each line of the old file, by line number. */
  oldTokens: Readonly<Record<number, readonly Token[]>>;
  /** The highlighter's tokens for each line of the new file, by line number. */
  newTokens: Readonly<Record<number, readonly Token[]>>;
  streaming: boolean;
  canAccept: boolean;
  canRevert: boolean;
  /** Whether an accept or a revert the host returned a promise for is still pending. Agents wait on it. */
  pending: boolean;
  agentConfirm: boolean;
  /** True for 2 s after the patch is copied. */
  copied: boolean;
};

export type DiffApi = {
  /** Calls `onAccept`. Offered while it's set and nothing is pending. */
  readonly accept: ((event?: Event) => void) | undefined;
  /** Calls `onRevert`. Offered while it's set and nothing is pending. */
  readonly revert: ((event?: Event) => void) | undefined;
  /** Shows every collapsed run of unchanged lines. Offered while there's one. */
  readonly expandAll: (() => void) | undefined;
  /** Copies the patch, and resolves with whether the clipboard write went through. Offered while there are rows. */
  readonly copy: ((event?: Event) => Promise<boolean>) | undefined;
  /** Shows a collapsed run of unchanged lines, by its row's key. */
  expand: (key: string) => void;
  /** Picks the rows in view once there are more than 400. Called by the viewport slot. */
  bindViewport: (el: HTMLElement) => () => void;
  /** Measures a rendered row. Called by the row slot. */
  measureRow: (index: number, el: HTMLElement) => () => void;
};

// `value` keys the part, so each row's element is measured at its own index. The render layers set it to the index.
type RowProps = { index: number; value?: string };
// Cells inside a row take its `value`.
type CellProps = { value?: string };

type DiffSlot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<DiffState, DiffApi, Props, Public>;

type DiffSlots = {
  root: DiffSlot;
  header: DiffSlot;
  path: DiffSlot<BaseSlotProps, { path: string; oldPath: string | undefined }>;
  status: DiffSlot<BaseSlotProps, { text: string }>;
  stats: DiffSlot<BaseSlotProps, { text: string }>;
  copy: DiffSlot;
  accept: DiffSlot;
  revert: DiffSlot;
  viewport: DiffSlot;
  table: DiffSlot<BaseSlotProps, { rows: readonly VirtualItem[] }>;
  row: DiffSlot<RowProps & BaseSlotProps, { kind: DiffRow["kind"] }>;
  "old-number": DiffSlot<CellProps & BaseSlotProps, { text: string }>;
  "new-number": DiffSlot<CellProps & BaseSlotProps, { text: string }>;
  sign: DiffSlot<CellProps & BaseSlotProps, { text: string }>;
  code: DiffSlot<
    CellProps & BaseSlotProps,
    { kind: DiffRow["kind"]; text: string; pieces: readonly DiffPiece[] }
  >;
  collapsed: DiffSlot<CellProps & BaseSlotProps, { text: string }>;
  "collapsed-text": DiffSlot<CellProps & BaseSlotProps, { text: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type DiffPrimitive = ReturnType<typeof definePrimitive<DiffOptions, DiffState, DiffApi, DiffSlots>>;

const VIRTUAL_PAST = 400;
// Until the viewport binds and the virtualizer measures, a long diff's first rows at a guessed height, so server
// markup shows them and hydrating moves nothing.
const ROW_HEIGHT_GUESS = 20;

const STATUS_TEXT: Record<DiffState["status"], string> = {
  added: "Added",
  modified: "",
  deleted: "Deleted",
  renamed: "Renamed",
};

const SIGN: Partial<Record<DiffRow["kind"], string>> = { add: "added", remove: "removed" };

const linesText = (count: number) => (count === 1 ? "1 line" : `${count} lines`);

function displayRows(rows: readonly DiffRow[], expanded: readonly string[]): DiffRow[] {
  return rows.flatMap((row) =>
    row.kind === "collapsed" && expanded.includes(row.key) ? (row.lines ?? []) : row,
  );
}

const flowRows = (display: readonly DiffRow[], count: number): VirtualItem[] =>
  display.slice(0, count).map((row, index) => ({
    index,
    key: row.key,
    start: index * ROW_HEIGHT_GUESS,
    size: ROW_HEIGHT_GUESS,
  }));

/** Each side of the diff as the highlighter sees it: its lines in order, with their line numbers. */
function sides(rows: readonly DiffRow[]) {
  const before: { line: number; text: string }[] = [];
  const after: { line: number; text: string }[] = [];
  const add = (row: DiffRow) => {
    if (row.oldLine !== undefined && row.kind !== "add") before.push({ line: row.oldLine, text: row.text });
    if (row.newLine !== undefined && row.kind !== "remove") after.push({ line: row.newLine, text: row.text });
  };
  for (const row of rows) {
    if (row.kind === "collapsed") row.lines?.forEach(add);
    else if (row.kind !== "hunk") add(row);
  }
  return { before, after };
}

const presentation = (options: DiffOptions, diff: DiffRows) => {
  const path = options.file?.path ?? diff.file.path ?? "";
  const status = options.file?.status ?? diff.file.status ?? "modified";
  return {
    label: options.label ?? path,
    path,
    oldPath: options.file?.oldPath ?? diff.file.oldPath,
    status,
    statusText: STATUS_TEXT[status],
    added: diff.added,
    removed: diff.removed,
  };
};

const flags = (options: DiffOptions) => ({
  streaming: options.streaming ?? false,
  canAccept: options.onAccept !== undefined,
  canRevert: options.onRevert !== undefined,
  agentConfirm: options.agentConfirm ?? true,
});

const inputOf = ({ patch, before, after }: DiffOptions) => ({ patch, before, after });

const byIndex = ({ props }: { props: RowProps }) => [String(props.index)];
const byValue = ({ props }: { props: CellProps }) => [props.value ?? ""];

// Only the code cell reads the highlighter's tokens.
const rowSelects = <Props extends object>(values: (part: { props: Props }) => string[], tokens = false) =>
  selects<DiffState, DiffApi, Props>({
    ...(!tokens && { oldTokens: [], newTokens: [] }),
    // Expanding a run moves the rows after it; a streamed hunk changes only its own.
    display: {
      values,
      moved: (before, after, notify) => {
        for (let i = 0; i < Math.max(before.length, after.length); i++) {
          if (before[i] !== after[i]) notify(String(i));
        }
      },
    },
    rows: {
      values,
      moved: (before, after, notify) => {
        const starts = new Map(before.map((row) => [row.index, row.start]));
        for (const row of after) if (starts.get(row.index) !== row.start) notify(String(row.index));
      },
    },
    diff: [],
    expanded: [],
    size: [],
    copied: [],
    pending: [],
  });

// The parts around the table read none of its rows, so a streamed hunk reaches only the rows it changed.
const outsideRows = selects<DiffState, DiffApi, BaseSlotProps>({
  diff: [],
  display: [],
  rows: [],
  size: [],
  oldTokens: [],
  newTokens: [],
});

const rowAt = (state: DiffState, value: string | undefined) => state.display[Number(value)];

export const diffPrimitive: DiffPrimitive = definePrimitive<DiffOptions, DiffState, DiffApi, DiffSlots>({
  name: "kind-diff",
  options: {
    file: "value",
    patch: "value",
    before: "value",
    after: "value",
    highlight: "value",
    streaming: "boolean",
    onAccept: "action",
    onRevert: "action",
    onCopy: "callback",
    agentConfirm: "boolean",
    label: "string",
  },
  state: (options) => {
    const diff = diffRows(inputOf(options));
    const display = displayRows(diff.rows, []);
    const virtual = display.length > VIRTUAL_PAST;
    return {
      ...presentation(options, diff),
      ...flags(options),
      diff,
      expanded: [],
      display,
      virtual,
      rows: flowRows(display, virtual ? 40 : display.length),
      size: display.length * ROW_HEIGHT_GUESS,
      oldTokens: {},
      newTokens: {},
      pending: false,
      copied: false,
    };
  },
  // The rows reach state through `diffRows` in `api`, which keeps the hunks it parsed before.
  sync: (options) => flags(options),
  api: (context) => {
    const { store } = context;
    const copy = createCopy(context);
    const pending = createPendingAction(context, { state: "pending" });
    let rowHeight = ROW_HEIGHT_GUESS;
    let viewport: HTMLElement | undefined;
    let disconnectVirtual: (() => void) | undefined;

    const virtual = createVirtualizer({
      count: () => store.get().display.length,
      key: (index) => store.get().display[index]?.key ?? String(index),
      estimate: () => rowHeight,
    });
    virtual.subscribe(() => {
      if (store.get().virtual) store.set({ rows: virtual.items(), size: virtual.size() });
    });

    const connect = () => {
      const shouldConnect = viewport !== undefined && store.get().virtual;
      if (shouldConnect && !disconnectVirtual && viewport) disconnectVirtual = virtual.connect(viewport);
      if (!shouldConnect && disconnectVirtual) {
        disconnectVirtual();
        disconnectVirtual = undefined;
      }
    };

    const show = (diff: DiffRows, expanded: readonly string[]) => {
      const display = displayRows(diff.rows, expanded);
      const isVirtual = display.length > VIRTUAL_PAST;
      store.set({ diff, expanded, display, virtual: isVirtual });
      connect();
      if (isVirtual && disconnectVirtual) store.set({ rows: virtual.items(), size: virtual.size() });
      else store.set({ rows: flowRows(display, isVirtual ? 40 : display.length) });
    };

    // One request at a time per side; once it settles, the newest text is asked for. Text that failed isn't asked
    // for again. A result applies while the side still starts with the text it was for, so a streamed patch keeps it.
    const highlighter = (side: "before" | "after", key: "oldTokens" | "newTokens") => {
      let requested: string | undefined;
      let failed: string | undefined;
      let busy = false;
      const request = () => {
        const { highlight, file } = context.options();
        const lines = sides(store.get().diff.rows)[side];
        const code = lines.map((line) => line.text).join("\n");
        if (!highlight || busy || code === requested || code === failed || code === "") return;
        busy = true;
        const settle = (tokens?: Token[]) => {
          if (destroyed) return;
          busy = false;
          if (!tokens) failed = code;
          else {
            const current = sides(store.get().diff.rows)[side];
            const byLine: Record<number, readonly Token[]> = {};
            tokenLines(tokens).forEach((line, i) => {
              const at = current[i];
              if (at && at.text === lines[i]?.text) byLine[at.line] = line;
            });
            requested = code;
            store.set({ [key]: byLine } as Pick<DiffState, typeof key>);
          }
          request();
        };
        highlight(code, file?.language).then(settle, () => settle());
      };
      return request;
    };
    let destroyed = false;
    context.onDestroy(() => {
      destroyed = true;
      disconnectVirtual?.();
    });
    const highlightBefore = highlighter("before", "oldTokens");
    const highlightAfter = highlighter("after", "newTokens");
    const highlight = () => {
      highlightBefore();
      highlightAfter();
    };

    context.onOptions((options) => {
      const { diff, expanded } = store.get();
      const next = diffRows(inputOf(options), diff);
      store.set(presentation(options, next));
      if (next !== diff) show(next, expanded);
      highlight();
    });
    highlight();

    const decide =
      (handler: "onAccept" | "onRevert", press: "accept-press" | "revert-press") => (event?: Event) => {
        const call = context.options()[handler];
        if (!call) return;
        const reason: DiffActionDetails["reason"] = event ? press : "imperative";
        const details = { reason, source: actionSource(event, reason) };
        void pending.run(() => call(details));
      };
    const accept = decide("onAccept", "accept-press");
    const revert = decide("onRevert", "revert-press");

    const expand = (key: string) => {
      const { diff, expanded } = store.get();
      if (!expanded.includes(key)) show(diff, [...expanded, key]);
    };

    return {
      get accept() {
        const { canAccept, pending } = store.get();
        return canAccept && !pending ? accept : undefined;
      },
      get revert() {
        const { canRevert, pending } = store.get();
        return canRevert && !pending ? revert : undefined;
      },
      get expandAll() {
        const { diff, expanded } = store.get();
        const collapsed = diff.rows.filter((row) => row.kind === "collapsed").map((row) => row.key);
        if (collapsed.every((key) => expanded.includes(key))) return undefined;
        return () => show(diff, collapsed);
      },
      get copy() {
        if (store.get().diff.rows.length === 0) return undefined;
        return async (event?: Event) => {
          const { patch, before = "", after = "" } = context.options();
          const { path, oldPath } = store.get();
          const text =
            patch ?? createTwoFilesPatch(oldPath ?? path, path, before, after, "", "", { context: 3 });
          const details = event
            ? { reason: "copy-press" as const, event }
            : { reason: "imperative" as const };
          if (dispatch(context, "onCopy", text, details)) return false;
          return copy(text);
        };
      },
      expand,
      bindViewport: (el) => {
        rowHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || rowHeight;
        viewport = el;
        connect();
        if (disconnectVirtual) store.set({ rows: virtual.items(), size: virtual.size() });
        return () => {
          viewport = undefined;
          connect();
        };
      },
      measureRow: (index, el) => (store.get().virtual ? virtual.measure(index, el) : () => {}),
    };
  },
  slots: (slot) => ({
    root: slot({
      selects: outsideRows,
      role: "figure",
      attrs: (state) => ({
        "aria-label": state.label || undefined,
        "data-kind-code": "",
        "data-status": state.status,
        "data-streaming": state.streaming ? "" : undefined,
        "aria-busy": state.pending ? "true" : undefined,
        // UI SDK marks a whole component, so every Diff action asks the person while Revert is offered.
        "data-agent-confirm":
          state.agentConfirm && state.canRevert ? "Reverts the change for you" : undefined,
      }),
    }),
    header: slot({ selects: outsideRows }),
    path: slot<BaseSlotProps, { path: string; oldPath: string | undefined }>({
      selects: outsideRows,
      state: (state) => ({ path: state.path, oldPath: state.oldPath }),
      attrs: (state) => ({ "data-renamed": state.oldPath && state.oldPath !== state.path ? "" : undefined }),
    }),
    status: slot<BaseSlotProps, { text: string }>({
      selects: outsideRows,
      present: (state) => state.statusText !== "",
      state: (state) => ({ text: state.statusText }),
      attrs: (state) => ({ "data-kind-badge": "", "data-status": state.status }),
    }),
    stats: slot<BaseSlotProps, { text: string }>({
      selects: outsideRows,
      role: "img",
      state: (state) => ({ text: `+${state.added} −${state.removed}` }),
      attrs: (state) => ({ "aria-label": `${state.added} added, ${state.removed} removed` }),
    }),
    copy: slot({
      selects: outsideRows,
      role: "button",
      focus: "native",
      present: (state) => state.diff.rows.length > 0,
      press: ({ api }, event) => void api.copy?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Copy diff",
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
        "data-copied": state.copied ? "" : undefined,
      }),
    }),
    accept: slot({
      selects: outsideRows,
      role: "button",
      focus: "native",
      present: (state) => state.canAccept,
      press: ({ api }, event) => api.accept?.(event),
      attrs: (state) => ({
        type: "button",
        "data-kind-button": "secondary",
        "data-kind-size": "sm",
        "aria-disabled": state.pending ? "true" : undefined,
      }),
    }),
    revert: slot({
      selects: outsideRows,
      role: "button",
      focus: "native",
      present: (state) => state.canRevert,
      press: ({ api }, event) => api.revert?.(event),
      attrs: (state) => ({
        type: "button",
        "data-kind-button": "ghost",
        "data-kind-size": "sm",
        "aria-disabled": state.pending ? "true" : undefined,
      }),
    }),
    viewport: slot({
      selects: outsideRows,
      // A tab stop, so the keyboard can scroll a long diff, as Conversation's viewport is.
      focus: "tab-stop",
      attrs: () => ({ tabindex: "0" }),
      bind: (el, { api }) => api.bindViewport(el),
    }),
    table: slot<BaseSlotProps, { rows: readonly VirtualItem[] }>({
      selects: selects<DiffState, DiffApi, BaseSlotProps>({ oldTokens: [], newTokens: [], diff: [] }),
      role: "table",
      state: (state) => ({ rows: state.rows }),
      attrs: (state) => ({
        "aria-label": state.label || undefined,
        "aria-rowcount": String(state.display.length),
        "aria-busy": state.streaming ? "true" : undefined,
        "data-virtual": state.virtual ? "" : undefined,
        style: css({
          "--kind-diff-size": state.virtual ? `${state.size}px` : undefined,
          "--kind-diff-digits": String(
            String(Math.max(state.diff.rows.at(-1)?.oldLine ?? 0, state.diff.rows.at(-1)?.newLine ?? 0, 1))
              .length,
          ),
        }),
      }),
    }),
    row: slot<RowProps, { kind: DiffRow["kind"] }>({
      props: { index: "number", value: "string" },
      selects: rowSelects<RowProps>(byIndex),
      role: "row",
      state: (state, { props }) => ({ kind: state.display[props.index]?.kind ?? "context" }),
      attrs: (state, { props }) => {
        const start = state.virtual ? state.rows.find((row) => row.index === props.index)?.start : undefined;
        return {
          "aria-rowindex": String(props.index + 1),
          "data-kind": state.display[props.index]?.kind,
          style: css({ "--kind-diff-row-start": start === undefined ? undefined : `${start}px` }),
        };
      },
      bind: (el, { api, props }) => api.measureRow(props.index, el),
    }),
    "old-number": slot<CellProps, { text: string }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue),
      // A row header only where there's a number, since an empty header names nothing.
      role: (state, { props }) => (rowAt(state, props.value)?.oldLine === undefined ? "cell" : "rowheader"),
      roles: ["rowheader", "cell"],
      state: (state, { props }) => ({ text: String(rowAt(state, props.value)?.oldLine ?? "") }),
    }),
    "new-number": slot<CellProps, { text: string }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue),
      // A row header only where there's a number, since an empty header names nothing.
      role: (state, { props }) => (rowAt(state, props.value)?.newLine === undefined ? "cell" : "rowheader"),
      roles: ["rowheader", "cell"],
      state: (state, { props }) => ({ text: String(rowAt(state, props.value)?.newLine ?? "") }),
    }),
    // Shows a `+` or `−` (diff.css), and reads as the change in words.
    sign: slot<CellProps, { text: string }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue),
      role: "cell",
      state: (state, { props }) => ({ text: SIGN[rowAt(state, props.value)?.kind ?? "context"] ?? "" }),
    }),
    code: slot<CellProps, { kind: DiffRow["kind"]; text: string; pieces: readonly DiffPiece[] }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue, true),
      role: "cell",
      state: (state, { props }) => {
        const row = rowAt(state, props.value);
        if (!row || row.kind === "hunk" || row.kind === "collapsed") {
          return { kind: row?.kind ?? "context", text: row?.text ?? "", pieces: [] };
        }
        const tokens =
          row.kind === "remove" ? state.oldTokens[row.oldLine ?? 0] : state.newTokens[row.newLine ?? 0];
        return { kind: row.kind, text: row.text, pieces: diffPieces(row.text, tokens, row.words) };
      },
    }),
    collapsed: slot<CellProps, { text: string }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue),
      role: "button",
      focus: "native",
      present: (state, { props }) => rowAt(state, props.value)?.kind === "collapsed",
      press: ({ api, store, props }) => {
        const row = rowAt(store.get(), props.value);
        if (row) api.expand(row.key);
      },
      state: (state, { props }) => ({
        text: `Show ${linesText(rowAt(state, props.value)?.lines?.length ?? 0)}`,
      }),
      attrs: () => ({ type: "button", "data-kind-button": "ghost", "data-kind-size": "sm" }),
    }),
    // The run's lines, hidden until find in page matches one, which shows the run.
    "collapsed-text": slot<CellProps, { text: string }>({
      props: { value: { kind: "string", from: "row" } },
      selects: rowSelects<CellProps>(byValue),
      present: (state, { props }) => rowAt(state, props.value)?.kind === "collapsed",
      state: (state, { props }) => ({
        text: (rowAt(state, props.value)?.lines ?? []).map((line) => line.text).join("\n"),
      }),
      attrs: () => hiddenAttrs(false, true),
      bind: (el, { api, store, props }) =>
        bindFindable(el, {
          shown: () => false,
          findable: () => true,
          reveal: () => {
            const row = rowAt(store.get(), props.value);
            if (row) api.expand(row.key);
          },
        }),
    }),
  }),
  agent: { actions: ["accept", "revert", "expandAll", "copy"] },
});
