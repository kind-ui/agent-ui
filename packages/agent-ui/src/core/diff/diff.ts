import {
  type ActionDetails,
  announce,
  bindFindable,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  createStickToBottom,
  css,
  definePrimitive,
  hiddenAttrs,
  type SlotDefinition,
  selects,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createTwoFilesPatch } from "diff";
import type { DiffFile } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { createCopy } from "../clipboard.js";
import type { Highlight, Token } from "../code-block/code-block.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import type { MotionMode } from "../motion/index.js";
import { bindStepPanel } from "../step/base.js";
import { WORDS } from "../words.js";
import { type DiffRow, type DiffRows, diffRows, tokenLines } from "./rows.js";
import {
  changeDecision,
  type DiffAction,
  type DiffChangeView,
  type DiffFileView,
  type DiffLineView,
  type DiffSummaryView,
  type DiffTableRow,
  diffAnnouncement,
  diffError,
  diffView,
  fileDecision,
  keepSame,
  targetKey,
} from "./view.js";

/** What Keep or Undo acts on: a file, one of its changes, or with no path every undecided file. */
export type DiffTarget = { path?: string; change?: number };

/** What kept or undid: a button, K or U on a focused row or change, or a call to the api or an agent. */
export type DiffActionDetails = ActionDetails & {
  reason: "keep-press" | "undo-press" | "shortcut" | "imperative";
};

/** What opened or closed a file. */
export type DiffOpenReason = "trigger-press" | "find-in-page" | "imperative";

export type DiffOptions = {
  /** One file, or a run's changes. With several, a summary with Keep all and Undo all sits above them. */
  files?: DiffFile[];
  /**
   * Names the region.
   * @default "Changes", or the path of a one-file Diff
   */
  label?: string;
  /**
   * Offers Keep on each undecided file and change, and Keep all. Return a promise to show "Keeping…" until it
   * settles; the target stays locked until you report its `decision` or replace the file.
   */
  onKeep?: (target: DiffTarget, details: DiffActionDetails) => unknown;
  /** Offers Undo, as `onKeep` offers Keep. Undo all asks first, in place. */
  onUndo?: (target: DiffTarget, details: DiffActionDetails) => unknown;
  /**
   * Whether each change of a file with several has its own Keep and Undo. Turn it off when you can only apply whole
   * files.
   * @default true
   */
  perChange?: boolean;
  /** The paths of the open files. */
  open?: string[];
  /** @default the only file's path, else none */
  defaultOpen?: string[];
  onOpenChange?: (open: string[], details: ChangeDetails<DiffOpenReason>) => void;
  /** Resolves colored tokens for each side of a file, as Code Block's does; lines show plain until it does. */
  highlight?: Highlight;
  /** @default "Keep" */
  keepLabel?: string;
  /** @default "Undo" */
  undoLabel?: string;
  /**
   * Whether an agent needs a person to confirm its actions while Undo is offered. UI SDK marks the whole
   * component, so `keep`, `open` and `copy` need one then too.
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * How much the open motion and a decided change's dimming animate. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type DiffState = {
  /** The region's name. */
  label: string;
  /** Whether there's one file, whose row is the header, and no summary. */
  single: boolean;
  /** The files' paths, in order. */
  paths: readonly string[];
  files: Readonly<Record<string, DiffFileView>>;
  changes: Readonly<Record<string, DiffChangeView>>;
  lines: Readonly<Record<string, DiffLineView>>;
  tables: Readonly<Record<string, readonly DiffTableRow[]>>;
  summary: DiffSummaryView;
  /** Whether any file's patch is still arriving: no file can be kept or undone yet. */
  streaming: boolean;
  open: readonly string[];
  /** Files still closing, shown until their exit ends. */
  closing: readonly string[];
  canKeep: boolean;
  canUndo: boolean;
  keepLabel: string;
  undoLabel: string;
  /** Whether Undo all is asking to be confirmed. */
  confirming: boolean;
  /** What Keep all or Undo all is sending, until every file it locked is decided. */
  allWorking: DiffAction | null;
  /** "Couldn't undo all changes" after Keep all or Undo all failed. */
  allError: string;
  /** Whether any call is pending. Agents wait on it. */
  pending: boolean;
  /** The file row with the Tab stop. */
  focused: string | null;
  agentConfirm: boolean;
  motion: MotionMode;
  /** True for 2 s after a file's patch is copied. */
  copied: boolean;
};

export type DiffApi = {
  /** Keeps a file, a change, or with no path every undecided file. Offered while `onKeep` is set and nothing streams. */
  readonly keep: ((path?: string, change?: number, event?: Event) => void) | undefined;
  /** Undoes a file, a change, or with no path every undecided file, without asking. Offered as `keep` is. */
  readonly undo: ((path?: string, change?: number, event?: Event) => void) | undefined;
  /** Opens a file. Offered while one is closed. */
  readonly open: ((path: string) => boolean) | undefined;
  /** Shows every collapsed run of unchanged lines and every cut-off file. Offered while there's one. */
  readonly expandAll: (() => void) | undefined;
  /** Copies a file's patch, and resolves with whether the clipboard write went through. */
  readonly copy: ((path: string) => Promise<boolean>) | undefined;
  setOpen: (
    path: string,
    open: boolean,
    cause?: { reason?: DiffOpenReason; event?: Event | undefined },
  ) => boolean;
  /** Shows a collapsed run, by its line's key. */
  expand: (key: string) => void;
  /** Shows the rest of a cut-off file. */
  showAll: (path: string) => void;
  /** Asks to confirm Undo all, or stops asking. */
  setConfirming: (confirming: boolean) => void;
  list: ListFocus<DiffState, FileProps>;
  recovery: ReturnType<typeof createFocusRecovery>;
  bindContent: (el: HTMLElement, path: string) => () => void;
  bindViewport: (el: HTMLElement, path: string) => () => void;
  /** The files' paths, for the agent's items. */
  getPaths: () => readonly string[];
  /** Whether `node` sits in a file's lines, where a change's header takes K and U. */
  inContent: (path: string, node: Node) => boolean;
  /** K keeps and U undoes the file or change a focused row holds. */
  shortcut: (event: KeyboardEvent, path: string, change?: number) => void;
};

type FileProps = { value?: string };
type FromFile = FileProps & BaseSlotProps;

type DiffSlot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<DiffState, DiffApi, Props, Public>;

type Text = { text: string };

type DiffSlots = {
  root: DiffSlot;
  summary: DiffSlot;
  "summary-title": DiffSlot<BaseSlotProps, Text>;
  "summary-counts": DiffSlot<BaseSlotProps, { text: string; name: string }>;
  "summary-mark": DiffSlot;
  "summary-progress": DiffSlot<BaseSlotProps, Text>;
  "summary-actions": DiffSlot;
  "undo-all": DiffSlot<BaseSlotProps, Text>;
  "keep-all": DiffSlot<BaseSlotProps, Text>;
  "undo-all-question": DiffSlot<BaseSlotProps, { text: string; warning: string }>;
  "undo-all-cancel": DiffSlot<BaseSlotProps, Text>;
  "undo-all-confirm": DiffSlot<BaseSlotProps, Text>;
  "summary-error": DiffSlot<BaseSlotProps, Text>;
  list: DiffSlot<BaseSlotProps, { paths: readonly string[] }>;
  file: DiffSlot<FromFile, { file: DiffFileView | undefined }>;
  "file-trigger": DiffSlot<FromFile>;
  "file-path": DiffSlot<FromFile, Text>;
  "file-old-path": DiffSlot<FromFile, Text>;
  "file-status": DiffSlot<FromFile, Text>;
  "file-counts": DiffSlot<FromFile, { text: string; name: string }>;
  "file-mark": DiffSlot<FromFile>;
  "file-actions": DiffSlot<FromFile>;
  "file-undo": DiffSlot<FromFile, Text>;
  "file-keep": DiffSlot<FromFile, Text>;
  "file-outcome": DiffSlot<FromFile, { text: string; working: boolean }>;
  "file-outcome-mark": DiffSlot<FromFile>;
  "file-error": DiffSlot<FromFile, Text>;
  "file-content": DiffSlot<FromFile>;
  "file-note": DiffSlot<FromFile, Text>;
  viewport: DiffSlot<FromFile>;
  table: DiffSlot<FromFile, { rows: readonly DiffTableRow[] }>;
  head: DiffSlot<FromFile>;
  column: DiffSlot<{ value?: string } & BaseSlotProps, Text>;
  change: DiffSlot<FromLine>;
  "change-title": DiffSlot<FromLine, Text>;
  "change-undo": DiffSlot<FromLine, Text>;
  "change-keep": DiffSlot<FromLine, Text>;
  "change-outcome": DiffSlot<FromLine, { text: string; working: boolean }>;
  "change-outcome-mark": DiffSlot<FromLine>;
  "change-error": DiffSlot<FromLine, Text>;
  line: DiffSlot<FromLine, { kind: DiffLineView["kind"] }>;
  "old-number": DiffSlot<FromLine, Text>;
  "new-number": DiffSlot<FromLine, Text>;
  sign: DiffSlot<FromLine, Text>;
  code: DiffSlot<FromLine, { line: DiffLineView | undefined }>;
  collapsed: DiffSlot<FromLine, { text: string; where: string }>;
  "collapsed-text": DiffSlot<FromLine, Text>;
  "show-all": DiffSlot<FromFile, Text>;
};

type FromLine = { value?: string } & BaseSlotProps;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type DiffPrimitive = ReturnType<typeof definePrimitive<DiffOptions, DiffState, DiffApi, DiffSlots>>;

const COLUMNS: Record<string, string> = {
  old: "Old line",
  new: "New line",
  sign: "Change",
  code: "Code",
};

const SIGNS: Partial<Record<DiffLineView["kind"], string>> = { add: "+", remove: "\u2212" };

const flags = (options: DiffOptions) => ({
  canKeep: options.onKeep !== undefined,
  canUndo: options.onUndo !== undefined,
  keepLabel: options.keepLabel ?? WORDS.keep,
  undoLabel: options.undoLabel ?? WORDS.undo,
  agentConfirm: options.agentConfirm ?? true,
  motion: options.motion ?? "auto",
});

const uniquePaths = (files: readonly DiffFile[]) => [...new Set(files.map((file) => file.path))];

const labelOf = (options: DiffOptions, paths: readonly string[]) =>
  options.label ?? (paths.length === 1 ? (paths[0] as string) : "Changes");

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

const inputOf = ({ patch, before, after }: DiffFile) => ({ patch, before, after });

const fromFile = { value: { kind: "string", from: "file" } } as const;
const fromLine = { value: { kind: "string", from: "line" } } as const;
const fromChange = { value: { kind: "string", from: "change" } } as const;

// Each part hears only its own entry: a streamed line reaches the rows it changed and its file's table.
const own = <Props extends { value?: string }>(record: "files" | "lines" | "changes" | "tables") =>
  selects<DiffState, DiffApi, Props>({
    paths: [],
    files: record === "files" ? ({ key }) => [key] : [],
    lines: record === "lines" ? ({ key }) => [key] : [],
    changes: record === "changes" ? ({ key }) => [key] : [],
    tables: record === "tables" ? ({ key }) => [key] : [],
    summary: [],
    open: record === "files" ? ({ key }) => [key] : [],
    closing: record === "files" ? ({ key }) => [key] : [],
  });

const ownFile = own<FromFile>("files");
const ownLine = own<FromLine>("lines");
const ownChange = own<FromLine>("changes");

// The summary reads no file, line or change.
const outside = selects<DiffState, DiffApi, BaseSlotProps>({
  files: [],
  lines: [],
  changes: [],
  tables: [],
  open: [],
  closing: [],
  focused: [],
});

const lineKey = (key: string) => key.slice(0, key.lastIndexOf("#"));

const buttonAttrs = (variant: string, disabled = false) => ({
  type: "button",
  "data-kind-button": variant,
  "data-kind-size": "sm",
  "aria-disabled": disabled ? "true" : undefined,
});

export const diffPrimitive: DiffPrimitive = definePrimitive<DiffOptions, DiffState, DiffApi, DiffSlots>({
  name: "kind-diff",
  options: {
    files: "value",
    label: "string",
    onKeep: "action",
    onUndo: "action",
    perChange: "boolean",
    open: "list",
    defaultOpen: "list",
    onOpenChange: "callback",
    highlight: "value",
    keepLabel: "string",
    undoLabel: "string",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options) => {
    const files = options.files ?? [];
    const paths = uniquePaths(files);
    const parsed = new Map(files.map((file) => [file.path, diffRows(inputOf(file))]));
    const view = diffView({
      files,
      parsed,
      tokens: new Map(),
      expanded: new Set(),
      full: new Set(),
      working: {},
      errors: {},
      perChange: options.perChange ?? true,
      canKeep: options.onKeep !== undefined,
      canUndo: options.onUndo !== undefined,
    });
    return {
      ...flags(options),
      ...view,
      label: labelOf(options, paths),
      single: paths.length === 1,
      open: options.open ?? options.defaultOpen ?? (paths.length === 1 ? paths : []),
      closing: [],
      confirming: false,
      allWorking: null,
      allError: "",
      pending: false,
      focused: null,
      copied: false,
    };
  },
  // The files reach state through `diffView` in `api`, which keeps the rows it parsed before.
  sync: (options) => ({
    ...flags(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const copy = createCopy(context);
    let parsed = new Map<string, DiffRows>();
    const tokens = new Map<string, { old: Record<number, Token[]>; new: Record<number, Token[]> }>();
    const expanded = new Set<string>();
    const full = new Set<string>();
    let working: Record<string, DiffAction> = {};
    let errors: Record<string, string> = {};
    let destroyed = false;
    // Each locked target, with the file it was locked for and the call that locked it.
    const locks = new Map<string, { action: DiffAction; file: DiffFile; call: number; all: boolean }>();
    let calls = 0;

    const fileOf = (path: string) => (context.options().files ?? []).find((file) => file.path === path);

    const compute = () => {
      const options = context.options();
      const files = options.files ?? [];
      const next = new Map<string, DiffRows>();
      for (const file of files) next.set(file.path, diffRows(inputOf(file), parsed.get(file.path)));
      parsed = next;
      const view = diffView({
        files,
        parsed,
        tokens,
        expanded,
        full,
        working,
        errors,
        perChange: options.perChange ?? true,
        canKeep: options.onKeep !== undefined,
        canUndo: options.onUndo !== undefined,
      });
      const state = store.get();
      const paths = sameList(state.paths, view.paths) ? state.paths : view.paths;
      store.set({
        paths,
        files: keepSame(state.files, view.files),
        changes: keepSame(state.changes, view.changes),
        lines: keepSame(state.lines, view.lines),
        tables: keepSame(state.tables, view.tables),
        summary: keepSame({ s: state.summary }, { s: view.summary }).s as DiffSummaryView,
        streaming: view.streaming,
        label: labelOf(options, paths),
        single: paths.length === 1,
        pending: locks.size > 0 && [...locks.values()].some((lock) => lock.call > 0),
      });
    };

    // A target stays locked until the host decides it or replaces its file (§4.1).
    const decided = (key: string, file: DiffFile | undefined) => {
      if (!file) return true;
      const hash = key.lastIndexOf("#");
      const isChange = hash > -1 && key.slice(0, hash) === file.path;
      if (isChange) return changeDecision(file, Number(key.slice(hash + 1))) !== undefined;
      return fileDecision(file, parsed.get(file.path)?.hunks.length ?? 0) !== undefined;
    };
    const sameContent = (a: DiffFile, b: DiffFile) =>
      a.patch === b.patch && a.before === b.before && a.after === b.after;

    const releaseSettled = () => {
      const done: { action: DiffAction; key: string; path: string; all: boolean }[] = [];
      for (const [key, lock] of locks) {
        const file = fileOf(lock.file.path);
        if (!decided(key, file) && file && sameContent(file, lock.file)) continue;
        locks.delete(key);
        delete working[key];
        if (decided(key, file)) done.push({ action: lock.action, key, path: lock.file.path, all: lock.all });
      }
      working = { ...working };
      const { allWorking } = store.get();
      const words = done
        .filter((each) => !each.all)
        .map((each) =>
          diffAnnouncement(
            each.action,
            each.path,
            each.key === each.path ? undefined : Number(each.key.slice(each.key.lastIndexOf("#") + 1)),
          ),
        );
      if (allWorking && ![...locks.values()].some((lock) => lock.all)) {
        const count = done.filter((each) => each.all).length;
        if (count > 0) words.push(diffAnnouncement(allWorking, undefined, undefined, count));
        store.set({ allWorking: null, confirming: false });
      }
      if (words.length > 0) announce(words.join(". "), { priority: "polite" });
    };

    const run = (action: DiffAction, target: DiffTarget, event: Event | undefined, shortcut: boolean) => {
      const options = context.options();
      const handler = action === "keep" ? options.onKeep : options.onUndo;
      const state = store.get();
      if (!handler || state.streaming) return;
      const { path, change: index } = target;
      let keys: string[];
      if (path === undefined) {
        if (state.allWorking) return;
        keys = state.paths.filter((each) => {
          const view = state.files[each];
          return view && !view.decision && !view.working;
        });
        if (keys.length === 0) return;
      } else {
        const view = state.files[path];
        if (!view || view.decision || view.working) return;
        if (index !== undefined) {
          const changeView = state.changes[`${path}#h${index}`];
          if (!changeView?.actionable) return;
        }
        keys = [targetKey(path, index)];
      }
      const call = ++calls;
      for (const key of keys) {
        const lockedFile = fileOf(path ?? key) as DiffFile;
        locks.set(key, { action, file: lockedFile, call, all: path === undefined });
        working[key] = action;
        delete errors[key];
      }
      working = { ...working };
      errors = { ...errors };
      store.set({
        ...(path === undefined && { allWorking: action, allError: "" }),
      });
      compute();
      const reason: DiffActionDetails["reason"] = shortcut
        ? "shortcut"
        : event
          ? action === "keep"
            ? "keep-press"
            : "undo-press"
          : "imperative";
      const details: DiffActionDetails = { reason, source: actionSource(event, reason) };
      const settle = (failed: boolean) => {
        if (destroyed) return;
        let changed = false;
        for (const [key, lock] of locks) {
          if (lock.call !== call) continue;
          if (failed) {
            locks.delete(key);
            delete working[key];
            changed = true;
          } else lock.call = 0;
        }
        if (failed && changed) {
          working = { ...working };
          const message = diffError(action, path, index);
          if (path === undefined) {
            store.set({ allWorking: null, allError: message, confirming: false });
          } else errors = { ...errors, [targetKey(path, index)]: message };
          announce(message, { priority: "polite" });
        }
        compute();
        releaseSettled();
        compute();
      };
      new Promise((resolve) => resolve(handler(target, details))).then(
        () => settle(false),
        () => settle(true),
      );
    };

    // One request per side at a time; once it settles, the newest text is asked for. Text that failed isn't asked
    // for again. A result applies while the side still starts with the text it was for, so a streamed patch keeps it.
    const highlighted = new Map<string, { requested?: string; failed?: string; busy: boolean }>();
    const sideLines = (rows: DiffRows | undefined, side: "old" | "new") => {
      const lines: { line: number; text: string }[] = [];
      const walk = (list: readonly DiffRow[]) => {
        for (const row of list) {
          if (row.kind === "collapsed") walk(row.lines ?? []);
          else if (side === "old" && row.kind !== "add" && row.oldLine !== undefined) {
            lines.push({ line: row.oldLine, text: row.text });
          } else if (side === "new" && row.kind !== "remove" && row.newLine !== undefined) {
            lines.push({ line: row.newLine, text: row.text });
          }
        }
      };
      for (const hunk of rows?.hunks ?? []) {
        walk(hunk.gap);
        walk(hunk.rows);
      }
      walk(rows?.end ?? []);
      return lines;
    };
    const highlightSide = (path: string, side: "old" | "new") => {
      const { highlight, files = [] } = context.options();
      const file = files.find((each) => each.path === path);
      const id = `${path}\n${side}`;
      const status = highlighted.get(id) ?? { busy: false };
      highlighted.set(id, status);
      const lines = sideLines(parsed.get(path), side);
      const code = lines.map((line) => line.text).join("\n");
      if (!highlight || !file || status.busy || code === status.requested || code === status.failed || !code)
        return;
      status.busy = true;
      const settle = (result?: Token[]) => {
        if (destroyed) return;
        status.busy = false;
        if (!result) status.failed = code;
        else {
          const current = sideLines(parsed.get(path), side);
          const byLine: Record<number, Token[]> = {};
          tokenLines(result).forEach((line, i) => {
            const at = current[i];
            if (at && at.text === lines[i]?.text) byLine[at.line] = line;
          });
          status.requested = code;
          const entry = tokens.get(path) ?? { old: {}, new: {} };
          tokens.set(path, { ...entry, [side]: byLine });
          compute();
        }
        highlightSide(path, side);
      };
      highlight(code, file.language).then(settle, () => settle());
    };
    const highlight = () => {
      for (const path of store.get().paths) {
        highlightSide(path, "old");
        highlightSide(path, "new");
      }
    };

    context.onOptions(() => {
      compute();
      releaseSettled();
      compute();
      highlight();
    });
    context.onDestroy(() => {
      destroyed = true;
    });
    compute();
    highlight();

    const setOpen: DiffApi["setOpen"] = (path, open, { reason = "imperative", event } = {}) => {
      const state = store.get();
      if (!state.paths.includes(path) || state.open.includes(path) === open) return false;
      const next = open ? [...state.open, path] : state.open.filter((each) => each !== path);
      const accepted = change("open", next, event ? { reason, event } : { reason });
      if (accepted && !open) store.set({ closing: [...store.get().closing, path] });
      return accepted;
    };

    const list = createListFocus<DiffState, FileProps>(context, { slot: "file-trigger" });

    return {
      get keep() {
        const { canKeep, streaming, paths } = store.get();
        return canKeep && !streaming && paths.length > 0
          ? (path?: string, index?: number, event?: Event) => run("keep", targetOf(path, index), event, false)
          : undefined;
      },
      get undo() {
        const { canUndo, streaming, paths } = store.get();
        return canUndo && !streaming && paths.length > 0
          ? (path?: string, index?: number, event?: Event) => run("undo", targetOf(path, index), event, false)
          : undefined;
      },
      get open() {
        const { paths, open } = store.get();
        return paths.some((path) => !open.includes(path)) ? (path: string) => setOpen(path, true) : undefined;
      },
      get expandAll() {
        const state = store.get();
        const more = state.paths.filter((path) => (state.files[path]?.hidden ?? 0) > 0);
        const collapsed = Object.keys(state.lines).filter((key) => state.lines[key]?.kind === "collapsed");
        if (more.length === 0 && collapsed.length === 0) return undefined;
        return () => {
          for (const path of more) full.add(path);
          // Expanding a run can reveal nothing collapsed inside it, so one pass shows every run.
          for (const key of collapsed) expanded.add(`${lineKey(key)}#${store.get().lines[key]?.row}`);
          compute();
        };
      },
      get copy() {
        if (store.get().paths.length === 0) return undefined;
        return (path: string) => {
          const file = fileOf(path);
          if (!file) return Promise.resolve(false);
          const view = store.get().files[path];
          const text =
            file.patch ??
            createTwoFilesPatch(view?.oldPath ?? path, path, file.before ?? "", file.after ?? "", "", "", {
              context: 3,
            });
          return copy(text);
        };
      },
      setOpen,
      expand: (key) => {
        const line = store.get().lines[key];
        if (line?.kind !== "collapsed") return;
        expanded.add(`${lineKey(key)}#${line.row}`);
        compute();
      },
      showAll: (path) => {
        full.add(path);
        compute();
      },
      setConfirming: (confirming) => {
        const state = store.get();
        if (state.allWorking || state.confirming === confirming) return;
        store.set({ confirming, allError: "" });
      },
      list,
      recovery: createFocusRecovery({
        fallback: ({ key, el }) => {
          const slot = el.getAttribute("data-slot") ?? "";
          if (slot.includes("change-"))
            return context.element("change-outcome", key) ?? context.element("change", key);
          if (slot.includes("file-")) {
            return context.element("file-outcome", key) ?? context.element("file-trigger", key);
          }
          if (slot.includes("undo-all-confirm") || slot.includes("undo-all-cancel")) {
            return context.element("undo-all") ?? context.element("summary-title");
          }
          return context.element("undo-all-cancel") ?? context.element("summary-title");
        },
      }),
      bindContent: (el, path) =>
        bindStepPanel(el, {
          isOpen: () => store.get().open.includes(path),
          isExiting: () => store.get().closing.includes(path),
          motion: () => store.get().motion,
          reveal: (event) => setOpen(path, true, { reason: "find-in-page", event }),
          trigger: () => context.element("file-trigger", path),
          subscribe: store.subscribe,
          exited: () => store.set({ closing: store.get().closing.filter((each) => each !== path) }),
        }),
      bindViewport: (el, path) => {
        // Follows the end only while the file streams, so opening a run near the end doesn't jump to it.
        const stick = createStickToBottom();
        let disconnect: (() => void) | undefined;
        const follow = () => {
          const streaming = store.get().files[path]?.streaming === true;
          if (streaming && !disconnect) disconnect = stick.connect(el);
          if (!streaming && disconnect) {
            disconnect();
            disconnect = undefined;
          }
        };
        follow();
        const unsubscribe = store.subscribe(follow);
        return () => {
          unsubscribe();
          disconnect?.();
        };
      },
      getPaths: () => store.get().paths,
      inContent: (path, node) => context.element("file-content", path)?.contains(node) ?? false,
      shortcut: (event, path, index) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        const key = event.key.toLowerCase();
        if (key !== "k" && key !== "u") return;
        const action: DiffAction = key === "k" ? "keep" : "undo";
        const options = context.options();
        if (!(action === "keep" ? options.onKeep : options.onUndo)) return;
        event.preventDefault();
        run(action, { path, ...(index !== undefined && { change: index }) }, event, true);
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      selects: outside,
      role: "region",
      attrs: (state) => ({
        "aria-label": state.label,
        "aria-busy": state.pending ? "true" : undefined,
        "data-single": state.single ? "" : undefined,
        "data-streaming": state.streaming ? "" : undefined,
        "data-motion": state.motion,
        // UI SDK marks a whole component, so every Diff action asks the person while Undo is offered.
        "data-agent-confirm": state.agentConfirm && state.canUndo ? "Undoes changes for you" : undefined,
      }),
    }),
    summary: slot({
      selects: outside,
      present: (state) => !state.single && state.paths.length > 0,
      attrs: (state) => ({
        "data-reviewed": state.summary.allReviewed ? "" : undefined,
        "data-confirming": state.confirming ? "" : undefined,
      }),
    }),
    // The summary is a heading, and a Tab stop once every change is reviewed, so focus has somewhere to go when Keep
    // all and Undo all leave.
    "summary-title": slot<BaseSlotProps, Text>({
      selects: outside,
      role: "heading",
      focus: "tab-stop",
      state: (state) => ({ text: state.summary.title }),
      attrs: (state) => ({ "aria-level": "3", ...(state.summary.allReviewed && { tabindex: "0" }) }),
    }),
    "summary-counts": slot<BaseSlotProps, { text: string; name: string }>({
      selects: outside,
      present: (state) => state.summary.counts !== "",
      state: (state) => ({ text: state.summary.counts, name: state.summary.countsName }),
    }),
    "summary-mark": slot({
      selects: outside,
      present: (state) => state.streaming,
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    "summary-progress": slot<BaseSlotProps, Text>({
      selects: outside,
      present: (state) => state.summary.progress !== "",
      state: (state) => ({ text: state.summary.progress }),
    }),
    "summary-actions": slot({
      selects: outside,
      present: (state) => !state.streaming && !state.summary.allReviewed && (state.canKeep || state.canUndo),
    }),
    "undo-all": slot<BaseSlotProps, Text>({
      selects: outside,
      role: "button",
      focus: "native",
      present: (state) => state.canUndo && !state.confirming && state.summary.undecided > 0,
      press: ({ api, store }) => {
        if (!store.get().allWorking) api.setConfirming(true);
      },
      state: () => ({ text: WORDS.undoAll }),
      attrs: (state) => buttonAttrs("ghost", state.allWorking !== null),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "keep-all": slot<BaseSlotProps, Text>({
      selects: outside,
      role: "button",
      focus: "native",
      present: (state) => state.canKeep && !state.confirming && state.summary.undecided > 0,
      press: ({ api }, event) => api.keep?.(undefined, undefined, event),
      state: () => ({ text: WORDS.keepAll }),
      attrs: (state) => ({
        ...buttonAttrs("secondary", state.allWorking !== null),
        "data-pending": state.allWorking === "keep" ? "" : undefined,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "undo-all-question": slot<BaseSlotProps, { text: string; warning: string }>({
      selects: outside,
      present: (state) => state.confirming,
      state: (state) => ({ text: state.summary.question, warning: WORDS.cantBeUndone }),
    }),
    "undo-all-cancel": slot<BaseSlotProps, Text>({
      selects: outside,
      role: "button",
      focus: "native",
      present: (state) => state.confirming,
      press: ({ api }) => api.setConfirming(false),
      state: () => ({ text: "Cancel" }),
      attrs: (state) => buttonAttrs("ghost", state.allWorking !== null),
      on: {
        keydown: (event, { api }) => {
          if ((event as KeyboardEvent).key === "Escape") api.setConfirming(false);
        },
      },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "undo-all-confirm": slot<BaseSlotProps, Text>({
      selects: outside,
      role: "button",
      focus: "native",
      present: (state) => state.confirming,
      press: ({ api }, event) => api.undo?.(undefined, undefined, event),
      state: () => ({ text: WORDS.undoAll }),
      attrs: (state) => ({
        ...buttonAttrs("danger", state.allWorking !== null),
        "data-pending": state.allWorking === "undo" ? "" : undefined,
      }),
      on: {
        keydown: (event, { api }) => {
          if ((event as KeyboardEvent).key === "Escape") api.setConfirming(false);
        },
      },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "summary-error": slot<BaseSlotProps, Text>({
      selects: outside,
      present: (state) => state.allError !== "",
      state: (state) => ({ text: state.allError }),
    }),
    list: slot<BaseSlotProps, { paths: readonly string[] }>({
      selects: selects<DiffState, DiffApi, BaseSlotProps>({ files: [], lines: [], changes: [], tables: [] }),
      role: "list",
      state: (state) => ({ paths: state.paths }),
    }),
    file: slot<FromFile, { file: DiffFileView | undefined }>({
      props: { value: "string" },
      selects: ownFile,
      role: "listitem",
      state: (state, { key }) => ({ file: state.files[key] }),
      attrs: (state, { key }) => {
        const file = state.files[key];
        return {
          "data-status": file?.status,
          "data-decision": file?.decision,
          "data-working": file?.working,
          "data-streaming": file?.streaming ? "" : undefined,
          "data-open": state.open.includes(key) ? "" : undefined,
        };
      },
      on: {
        // K and U on the row's own controls, not inside its lines, where a change's header takes them.
        keydown: (event, { api, key }) => {
          if (api.inContent(key, event.target as Node)) return;
          api.shortcut(event as KeyboardEvent, key);
        },
      },
    }),
    "file-trigger": slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      role: "button",
      focus: "roving",
      press: ({ api, store, key }, event) =>
        api.setOpen(key, !store.get().open.includes(key), { reason: "trigger-press", event }),
      attrs: (state, part) => {
        const open = state.open.includes(part.key);
        return {
          type: "button",
          tabindex: part.api.list.roving.tabIndex(state, part),
          "aria-expanded": open ? "true" : "false",
          "aria-controls": `${part.id}-content`,
          "aria-keyshortcuts": state.files[part.key]?.actionable ? "K U" : undefined,
          "data-open": open ? "" : undefined,
        };
      },
      on: {
        keydown: (event, { api, el }) => {
          if (el && event.target === el) api.list.roving.keydown(event as KeyboardEvent, el);
        },
      },
      bind: (el, part) => {
        const unbind = part.api.list.roving.bind(el, part);
        const unrecover = part.api.list.recovery.bind(el, part);
        return () => {
          unbind();
          unrecover();
        };
      },
    }),
    "file-path": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      state: (state, { key }) => ({ text: state.files[key]?.path ?? "" }),
    }),
    "file-old-path": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => state.files[key]?.oldPath !== undefined,
      state: (state, { key }) => ({ text: `from ${state.files[key]?.oldPath ?? ""}` }),
    }),
    "file-status": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => (state.files[key]?.statusText ?? "") !== "",
      state: (state, { key }) => ({ text: state.files[key]?.statusText ?? "" }),
    }),
    "file-counts": slot<FromFile, { text: string; name: string }>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => (state.files[key]?.counts ?? "") !== "",
      state: (state, { key }) => ({
        text: state.files[key]?.counts ?? "",
        name: state.files[key]?.countsName ?? "",
      }),
    }),
    "file-mark": slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => state.files[key]?.streaming === true,
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    // Keeps its width whatever it holds, so Keep and Undo appearing on hover move nothing.
    "file-actions": slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      present: (state) => state.canKeep || state.canUndo,
      attrs: (state, { key }) => ({ "data-actionable": state.files[key]?.actionable ? "" : undefined }),
    }),
    "file-undo": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      role: "button",
      focus: "native",
      present: (state, { key }) => state.canUndo && state.files[key]?.actionable === true,
      press: ({ api, key }, event) => api.undo?.(key, undefined, event),
      state: (state) => ({ text: state.undoLabel }),
      attrs: (state, { key }) => ({
        ...buttonAttrs("ghost"),
        "aria-label": `${state.undoLabel} ${key}`,
        "aria-keyshortcuts": "U",
        "data-diff-icon": "undo",
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "file-keep": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      role: "button",
      focus: "native",
      present: (state, { key }) => state.canKeep && state.files[key]?.actionable === true,
      press: ({ api, key }, event) => api.keep?.(key, undefined, event),
      state: (state) => ({ text: state.keepLabel }),
      attrs: (state, { key }) => ({
        ...buttonAttrs("ghost"),
        "aria-label": `${state.keepLabel} ${key}`,
        "aria-keyshortcuts": "K",
        "data-diff-icon": "keep",
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    // "Kept", "Undone", "Keeping…" or "Undoing…" in the buttons' place. A Tab stop, so focus moves here from a
    // pressed button.
    "file-outcome": slot<FromFile, { text: string; working: boolean }>({
      props: fromFile,
      selects: ownFile,
      focus: "tab-stop",
      present: (state, { key }) => Boolean(state.files[key]?.decision || state.files[key]?.working),
      state: (state, { key }) => outcome(state.files[key]),
      attrs: (state, { key }) => ({
        tabindex: "0",
        "data-state": state.files[key]?.decision ?? (state.files[key]?.working ? "working" : undefined),
      }),
    }),
    "file-outcome-mark": slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => state.files[key]?.working !== undefined,
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    "file-error": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => (state.files[key]?.error ?? "") !== "",
      state: (state, { key }) => ({ text: state.files[key]?.error ?? "" }),
    }),
    "file-content": slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      attrs: (state, part) => {
        const open = state.open.includes(part.key);
        return {
          id: `${part.id}-content`,
          "data-motion": state.motion,
          "data-open": open ? "" : undefined,
          ...hiddenAttrs(open || state.closing.includes(part.key), true),
        };
      },
      bind: (el, { api, key }) => api.bindContent(el, key),
    }),
    "file-note": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      present: (state, { key }) => (state.files[key]?.note ?? "") !== "",
      state: (state, { key }) => ({ text: state.files[key]?.note ?? "" }),
    }),
    // A Tab stop, so the keyboard can scroll a long file, as Conversation's viewport does.
    viewport: slot<FromFile>({
      props: fromFile,
      selects: ownFile,
      focus: "tab-stop",
      present: (state, { key }) => (state.files[key]?.note ?? "") === "",
      attrs: (state, { key }) => ({
        tabindex: "0",
        "aria-label": key,
        style: css({ "--kind-diff-digits": String(state.files[key]?.digits ?? 1) }),
      }),
      bind: (el, { api, key }) => api.bindViewport(el, key),
    }),
    table: slot<FromFile, { rows: readonly DiffTableRow[] }>({
      props: fromFile,
      selects: own<FromFile>("tables"),
      role: "table",
      state: (state, { key }) => ({ rows: state.tables[key] ?? [] }),
      attrs: (_, { key }) => ({ "aria-label": key }),
    }),
    // Column headers for screen readers; the stylesheet hides them.
    head: slot<FromFile>({ props: fromFile, selects: outside, role: "row" }),
    column: slot<{ value?: string } & BaseSlotProps, Text>({
      props: { value: "string" },
      selects: outside,
      role: "columnheader",
      state: (_, { props }) => ({ text: COLUMNS[props.value ?? ""] ?? "" }),
    }),
    change: slot<FromLine>({
      props: { value: "string" },
      selects: ownChange,
      role: "row",
      attrs: (state, { key }) => {
        const view = state.changes[key];
        return {
          "data-decision": view?.decision,
          "data-working": view?.working,
          "data-actionable": view?.actionable ? "" : undefined,
        };
      },
      on: {
        keydown: (event, { api, store, key }) => {
          const view = store.get().changes[key];
          if (view) api.shortcut(event as KeyboardEvent, view.path, view.index);
        },
      },
    }),
    "change-title": slot<FromLine, Text>({
      props: fromChange,
      selects: ownChange,
      role: "cell",
      state: (state, { key }) => ({ text: state.changes[key]?.title ?? "" }),
      attrs: () => ({ "aria-colspan": "4" }),
    }),
    "change-undo": slot<FromLine, Text>({
      props: fromChange,
      selects: ownChange,
      role: "button",
      focus: "native",
      present: (state, { key }) => state.canUndo && state.changes[key]?.actionable === true,
      press: ({ api, store, key }, event) => {
        const view = store.get().changes[key];
        if (view) api.undo?.(view.path, view.index, event);
      },
      state: (state) => ({ text: state.undoLabel }),
      attrs: (state, { key }) => ({
        ...buttonAttrs("ghost"),
        "aria-label": `${state.undoLabel} change ${(state.changes[key]?.index ?? 0) + 1}`,
        "aria-keyshortcuts": "U",
        "data-diff-icon": "undo",
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "change-keep": slot<FromLine, Text>({
      props: fromChange,
      selects: ownChange,
      role: "button",
      focus: "native",
      present: (state, { key }) => state.canKeep && state.changes[key]?.actionable === true,
      press: ({ api, store, key }, event) => {
        const view = store.get().changes[key];
        if (view) api.keep?.(view.path, view.index, event);
      },
      state: (state) => ({ text: state.keepLabel }),
      attrs: (state, { key }) => ({
        ...buttonAttrs("ghost"),
        "aria-label": `${state.keepLabel} change ${(state.changes[key]?.index ?? 0) + 1}`,
        "aria-keyshortcuts": "K",
        "data-diff-icon": "keep",
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    "change-outcome": slot<FromLine, { text: string; working: boolean }>({
      props: fromChange,
      selects: ownChange,
      focus: "tab-stop",
      present: (state, { key }) => Boolean(state.changes[key]?.decision || state.changes[key]?.working),
      state: (state, { key }) => outcome(state.changes[key]),
      attrs: (state, { key }) => ({
        tabindex: "0",
        "data-state": state.changes[key]?.decision ?? (state.changes[key]?.working ? "working" : undefined),
      }),
    }),
    "change-outcome-mark": slot<FromLine>({
      props: fromChange,
      selects: ownChange,
      present: (state, { key }) => state.changes[key]?.working !== undefined,
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    "change-error": slot<FromLine, Text>({
      props: fromChange,
      selects: ownChange,
      present: (state, { key }) => (state.changes[key]?.error ?? "") !== "",
      state: (state, { key }) => ({ text: state.changes[key]?.error ?? "" }),
    }),
    line: slot<FromLine, { kind: DiffLineView["kind"] }>({
      props: { value: "string" },
      selects: ownLine,
      role: "row",
      state: (state, { key }) => ({ kind: state.lines[key]?.kind ?? "context" }),
      attrs: (state, { key }) => {
        const line = state.lines[key];
        return {
          "data-kind": line?.kind,
          "data-undone": line?.undone ? "" : undefined,
          "data-motion": state.motion,
        };
      },
    }),
    // A row header only where there's a number, since an empty header names nothing.
    "old-number": slot<FromLine, Text>({
      props: fromLine,
      selects: ownLine,
      role: (state, { key }) => (state.lines[key]?.oldLine === undefined ? "cell" : "rowheader"),
      roles: ["rowheader", "cell"],
      state: (state, { key }) => ({ text: String(state.lines[key]?.oldLine ?? "") }),
      attrs: (state, { key }) => ({ "data-line": String(state.lines[key]?.oldLine ?? "") }),
    }),
    "new-number": slot<FromLine, Text>({
      props: fromLine,
      selects: ownLine,
      role: (state, { key }) => (state.lines[key]?.newLine === undefined ? "cell" : "rowheader"),
      roles: ["rowheader", "cell"],
      state: (state, { key }) => ({ text: String(state.lines[key]?.newLine ?? "") }),
      attrs: (state, { key }) => ({ "data-line": String(state.lines[key]?.newLine ?? "") }),
    }),
    // Drawn from its attribute, so a copy holds only code; the code cell says the change in words.
    sign: slot<FromLine, Text>({
      props: fromLine,
      selects: ownLine,
      role: "cell",
      state: () => ({ text: "" }),
      attrs: (state, { key }) => ({ "data-sign": SIGNS[state.lines[key]?.kind ?? "context"] ?? "" }),
    }),
    code: slot<FromLine, { line: DiffLineView | undefined }>({
      props: fromLine,
      selects: ownLine,
      role: "cell",
      state: (state, { key }) => ({ line: state.lines[key] }),
    }),
    collapsed: slot<FromLine, { text: string; where: string }>({
      props: fromLine,
      selects: ownLine,
      role: "button",
      focus: "native",
      present: (state, { key }) => state.lines[key]?.kind === "collapsed",
      press: ({ api, key }) => api.expand(key),
      state: (state, { key }) => ({
        text: state.lines[key]?.show ?? "",
        where: state.lines[key]?.where ?? "",
      }),
      attrs: () => ({ type: "button" }),
    }),
    // The run's lines, hidden until find in page matches one, which shows the run.
    "collapsed-text": slot<FromLine, Text>({
      props: fromLine,
      selects: ownLine,
      present: (state, { key }) => state.lines[key]?.kind === "collapsed",
      state: (state, { key }) => ({ text: state.lines[key]?.hiddenText ?? "" }),
      attrs: () => hiddenAttrs(false, true),
      bind: (el, { api, key }) =>
        bindFindable(el, { shown: () => false, findable: () => true, reveal: () => api.expand(key) }),
    }),
    "show-all": slot<FromFile, Text>({
      props: fromFile,
      selects: ownFile,
      role: "button",
      focus: "native",
      present: (state, { key }) => (state.files[key]?.hidden ?? 0) > 0,
      press: ({ api, key }) => api.showAll(key),
      state: (state, { key }) => {
        const total = (state.tables[key]?.length ?? 0) + (state.files[key]?.hidden ?? 0);
        return { text: `Show full diff (${total.toLocaleString("en-US")} lines)` };
      },
      attrs: () => buttonAttrs("ghost"),
    }),
  }),
  agent: {
    actions: ["keep", "undo", "open", "expandAll", "copy"],
    items: (api: DiffApi) => api.getPaths().map((path) => ({ value: path, label: path })),
    closed: true,
  },
});

function targetOf(path: string | undefined, change: number | undefined): DiffTarget {
  return {
    ...(path !== undefined && { path }),
    ...(path !== undefined && change !== undefined && { change }),
  };
}

function outcome(
  view: { decision?: DiffFileView["decision"]; working?: DiffAction | undefined } | undefined,
) {
  if (view?.decision) return { text: view.decision === "kept" ? WORDS.kept : WORDS.undone, working: false };
  if (view?.working) return { text: view.working === "keep" ? WORDS.keeping : WORDS.undoing, working: true };
  return { text: "", working: false };
}
