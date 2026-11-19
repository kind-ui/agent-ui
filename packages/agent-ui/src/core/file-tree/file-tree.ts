import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  dispatch,
  type SlotDefinition,
  selects,
  type TreeItemData,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createTreeController, type TreeController } from "@ui-sdk/core/tree";
import type { FileTreeEntry } from "../../types/index.js";
import { cached, memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { holdTransitions } from "../step/base.js";
import { parentFolders, pathItems, treeValues } from "../tree.js";

/** How a change touched a file: `"added"`, `"modified"`, `"deleted"` or `"renamed"`. */
export type FileTreeChange = NonNullable<FileTreeEntry["change"]>;

/**
 * `"item-press"`: a press, or Enter or Space, on a row. `"list-navigation"`: an arrow key or `*`.
 * `"find-in-page"`: the browser's find in page matched a name inside. `"imperative"`: an `api` call, like an agent's.
 */
export type FileTreeExpandedChangeReason = "item-press" | "list-navigation" | "find-in-page" | "imperative";

/** `"item-press"`: a press, or Enter or Space, on a row. `"imperative"`: an `api` call, like an agent's `select`. */
export type FileTreeValueChangeReason = "item-press" | "imperative";

/** `"item-press"`: a press or Enter on a file. `"imperative"`: an `api` call, like an agent's `select`. */
export type FileTreeSelectReason = "item-press" | "imperative";

export type FileTreeOptions = {
  /**
   * The files, by relative path like `src/index.ts`, each with how the change touched it. Folders come from the
   * paths, sorted before files; a path ending in `/` is an empty folder.
   * @default []
   */
  entries?: FileTreeEntry[];
  /**
   * Names the tree.
   * @default "Files"
   */
  label?: string;
  /** The selected path. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The selected path at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a person or `select` selects a file or folder, with why. */
  onValueChange?: (value: string | null, details: ChangeDetails<FileTreeValueChangeReason>) => void;
  /** The open folders' paths, without a trailing `/`. Passing it controls them: change them in `onExpandedChange`. */
  expanded?: string[];
  /**
   * The open folders at first, when `expanded` isn't passed.
   * @default []
   */
  defaultExpanded?: string[];
  /** Called when folders open or close, with why. */
  onExpandedChange?: (expanded: string[], details: ChangeDetails<FileTreeExpandedChangeReason>) => void;
  /**
   * Called with a file's path when a person presses it or presses Enter on it, or an agent selects it, once the
   * selection moved to it; not when `onValueChange` refused that.
   */
  onSelect?: (path: string, details: ChangeDetails<FileTreeSelectReason>) => void;
  /**
   * How folders open and close, and how files added after the first frame come in. `"auto"` follows
   * `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** A file or folder as its row shows it, which the item part hands its render function. */
export type FileTreeRow = {
  /** The last part of its path. */
  name: string;
  /** Whether it's a folder, which holds other rows, rather than a file. */
  folder: boolean;
  /** A file's own change, or the most significant change inside a folder. */
  change: FileTreeChange | undefined;
  /** A file's change as its badge's letter, like `M` for modified; empty for a folder or an unchanged file. */
  letter: string;
  /** A file's added lines, shown as `+N`. */
  additions: number | undefined;
  /** A file's removed lines, shown as `−N`. */
  deletions: number | undefined;
};

export type FileTreeState = {
  /** The `entries`. */
  entries: FileTreeEntry[];
  /** The tree's data from `entries`, through `pathItems`. */
  items: TreeItemData[];
  /** Each row by its path. A row that didn't change keeps its object. */
  rows: Record<string, FileTreeRow>;
  /** The `label`, else "Files". */
  label: string;
  /** The selected path. */
  value: string | null;
  /** The open folders' paths. */
  expanded: string[];
  /** Whether `onSelect` is set. */
  canSelect: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What the root hands the Tree: pass every key to it. */
export type FileTreeTreeState = {
  /** The primitive's own, which it reads and writes the selection and the open folders through. */
  controller: TreeController;
  /** The `items`, so keyboard navigation knows the whole tree. */
  items: TreeItemData[];
  /** The selected path when the Tree mounted. */
  defaultValue: string | null;
  /** The open folders when the Tree mounted. */
  defaultExpanded: string[];
  /** The `label`. */
  "aria-label": string;
  /** Closed folders stay in the page, so find in page matches the names inside and rows only enter once. */
  hiddenUntilFound: true;
};

export type FileTreeApi = {
  /** The selected path. */
  getValue: () => string | null;
  /** The open folders' paths. */
  getExpanded: () => string[];
  /** The `entries`. */
  getEntries: () => FileTreeEntry[];
  /** Selects a file or folder, or nothing with `null`. Returns `false` for an unknown path or a refused change. */
  setValue: (path: string | null) => boolean;
  /** Opens exactly these folders. Returns `false` when one isn't a folder, or for a refused change. */
  setExpanded: (paths: string[]) => boolean;
  /** Opens a folder and the folders it's in. Returns `false` for a file or an unknown path, or a refused change. */
  expand: (path: string) => boolean;
  /** Closes a folder. Returns `false` for a file or an unknown path, or a refused change. */
  collapse: (path: string) => boolean;
  /**
   * Selects a file and calls `onSelect`, as Enter on it would. Returns `false` for a folder or an unknown path, or
   * when the host cancels. Offered only while `onSelect` is set.
   */
  readonly select: ((path: string) => boolean) | undefined;
  /** Reports what a person changed in the Tree. Called as presses, keys and find in page bubble to the root. */
  read: (event: Event) => void;
  /** Writes the selection and the open folders into the Tree once it has attached the controller. */
  syncTree: () => void;
  /** Hands the Tree its props. Called by the root slot. */
  treeState: (state: FileTreeState) => FileTreeTreeState;
  /** Plays a row's entrance when it arrives after the first frame. Called by the item slot. */
  bindItem: (el: HTMLElement, path: string) => void;
  /** Holds transitions for the first frames and starts counting rows as new after them. Called by the root slot. */
  bindRoot: (el: HTMLElement) => () => void;
};

type ItemProps = { value: string };
type ItemPartProps = { value?: string };

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<FileTreeState, FileTreeApi, Props, Public>;

type FileTreeSlots = {
  root: Slot<BaseSlotProps, FileTreeTreeState>;
  item: Slot<ItemProps & BaseSlotProps, FileTreeRow>;
  counts: Slot<ItemPartProps & BaseSlotProps>;
  badge: Slot<ItemPartProps & BaseSlotProps>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type FileTreePrimitive = ReturnType<
  typeof definePrimitive<FileTreeOptions, FileTreeState, FileTreeApi, FileTreeSlots>
>;

const noEntries: FileTreeEntry[] = [];
const noRow: FileTreeRow = {
  name: "",
  folder: false,
  change: undefined,
  letter: "",
  additions: undefined,
  deletions: undefined,
};
const letters: Record<FileTreeChange, string> = { added: "A", modified: "M", deleted: "D", renamed: "R" };
// What a folder shows when files inside it changed differently: the first of these it holds.
const significance: FileTreeChange[] = ["deleted", "added", "modified", "renamed"];

const itemsCache = new WeakMap<FileTreeEntry[], TreeItemData[]>();
const valuesCache = new WeakMap<TreeItemData[], { branches: string[]; leaves: string[] }>();
const rowsCache = new WeakMap<FileTreeEntry[], Record<string, FileTreeRow>>();
const fileRows = new WeakMap<FileTreeEntry, FileTreeRow>();
const itemsOf = (entries: FileTreeEntry[]) => cached(itemsCache, entries, pathItems);
const valuesOf = (items: TreeItemData[]) => cached(valuesCache, items, treeValues);

const fileRow = (entry: FileTreeEntry, name: string): FileTreeRow => ({
  name,
  folder: false,
  change: entry.change,
  letter: entry.change ? letters[entry.change] : "",
  additions: entry.additions,
  deletions: entry.deletions,
});

// A file's row keeps its object while the host keeps its entry, so only a changed file's parts have new state.
const rowsOf = (entries: FileTreeEntry[]) =>
  cached(rowsCache, entries, () => {
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));
    const folderChanges = new Map<string, FileTreeChange>();
    for (const { path, change } of entries) {
      if (!change) continue;
      for (const folder of parentFolders(path)) {
        const shown = folderChanges.get(folder);
        if (!shown || significance.indexOf(change) < significance.indexOf(shown))
          folderChanges.set(folder, change);
      }
    }
    const rows: Record<string, FileTreeRow> = {};
    const visit = (level: TreeItemData[]) => {
      for (const item of level) {
        const entry = byPath.get(item.value);
        if (item.children) {
          rows[item.value] = {
            ...noRow,
            name: item.label,
            folder: true,
            change: folderChanges.get(item.value),
          };
          visit(item.children);
        } else if (entry) rows[item.value] = cached(fileRows, entry, () => fileRow(entry, item.label));
      }
    };
    visit(itemsOf(entries));
    return rows;
  });

// Own keys only, so a path like "constructor" doesn't find `Object`'s.
const rowAt = ({ rows }: FileTreeState, path: string) =>
  Object.hasOwn(rows, path) ? (rows[path] as FileTreeRow) : noRow;
const fromItem = { value: { kind: "string", from: "item" } } as const;

/** A row's parts hear only about their own row. */
const own = selects<FileTreeState, FileTreeApi, ItemPartProps>({
  rows: ({ key }) => [key],
  entries: [],
  items: [],
});

const sameFolders = (a: readonly string[], b: readonly string[]) => {
  const shown = new Set(a);
  const wanted = new Set(b);
  return shown.size === wanted.size && [...shown].every((path) => wanted.has(path));
};

const countsLabel = ({ additions, deletions }: FileTreeRow) =>
  [
    additions === undefined ? "" : `${additions} ${additions === 1 ? "addition" : "additions"}`,
    deletions === undefined ? "" : `${deletions} ${deletions === 1 ? "deletion" : "deletions"}`,
  ]
    .filter(Boolean)
    .join(", ");

const presentation = ({ entries = noEntries, label, onSelect, motion = "auto" }: FileTreeOptions) => {
  return {
    entries,
    items: itemsOf(entries),
    rows: rowsOf(entries),
    label: label ?? "Files",
    canSelect: onSelect !== undefined,
    motion,
  };
};

export const fileTreePrimitive: FileTreePrimitive = definePrimitive<
  FileTreeOptions,
  FileTreeState,
  FileTreeApi,
  FileTreeSlots
>({
  name: "kind-file-tree",
  options: {
    entries: "value",
    label: "string",
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    expanded: "value",
    defaultExpanded: "value",
    onExpandedChange: "callback",
    onSelect: "callback",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    value: options.value ?? options.defaultValue ?? null,
    expanded: options.expanded ?? options.defaultExpanded ?? [],
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
    ...(options.expanded === undefined ? {} : { expanded: options.expanded }),
  }),
  controlled: ["value", "expanded"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const controller = createTreeController();
    const initial = store.get();
    let resync = 0;
    context.onDestroy(() => {
      if (resync) cancelAnimationFrame(resync);
    });

    // Web hosts can only set `entries` once the element exists, so rows in the first frame count as known and don't
    // play the entrance.
    let mounting = true;
    const known = new Set<string>();
    context.onOptions(({ entries = noEntries }) => {
      const rows = rowsOf(entries);
      // Forgotten, so a file added again plays its entrance.
      for (const path of known) if (!Object.hasOwn(rows, path)) known.delete(path);
    });

    // Held while `read` reports a person's change, so writing the open folders doesn't undo a selection not yet read.
    let reading = false;
    const syncTree = () => {
      if (reading) return;
      const { value, expanded } = store.get();
      // The controller reads `undefined` until the Tree attaches it.
      const shown = controller.getExpanded();
      if (shown === undefined) return;
      if (!sameFolders(shown, expanded)) controller.setExpanded(expanded);
      if (controller.getValue() !== value) controller.setValue(value);
    };
    store.subscribe(syncTree);

    const isFolder = (path: string) => valuesOf(store.get().items).branches.includes(path);
    const isFile = (path: string) => valuesOf(store.get().items).leaves.includes(path);
    const setExpanded = (expanded: string[]) =>
      sameFolders(expanded, store.get().expanded) || change("expanded", expanded, { reason: "imperative" });
    const setValue = (path: string | null) =>
      path === store.get().value || change("value", path, { reason: "imperative" });
    const select = (path: string, event?: Event) =>
      !dispatch(
        context,
        "onSelect",
        path,
        event ? { reason: "item-press", event } : { reason: "imperative" },
      );

    const treeState = memo(
      (label: string, items: TreeItemData[]): FileTreeTreeState => ({
        controller,
        items,
        defaultValue: initial.value,
        defaultExpanded: initial.expanded,
        "aria-label": label,
        hiddenUntilFound: true,
      }),
    );

    return {
      getValue: () => store.get().value,
      getExpanded: () => store.get().expanded,
      getEntries: () => store.get().entries,
      setValue: (path) => (path === null || isFolder(path) || isFile(path)) && setValue(path),
      setExpanded: (paths) => paths.every(isFolder) && setExpanded(paths),
      expand: (path) =>
        isFolder(path) && setExpanded([...new Set([...store.get().expanded, ...parentFolders(path), path])]),
      collapse: (path) => isFolder(path) && setExpanded(store.get().expanded.filter((open) => open !== path)),
      get select() {
        if (!store.get().canSelect) return undefined;
        return (path: string) => {
          return isFile(path) && setValue(path) && select(path);
        };
      },
      read: (event) => {
        const expanded = controller.getExpanded();
        if (expanded === undefined) return;
        const value = controller.getValue() as string | null;
        const key = event instanceof KeyboardEvent ? event.key : undefined;
        const modified = event instanceof KeyboardEvent && (event.ctrlKey || event.metaKey || event.altKey);
        const pressed = event.type === "click" || key === "Enter" || key === " ";
        const state = store.get();
        reading = true;
        let accepted = true;
        if (!sameFolders(expanded, state.expanded)) {
          const reason =
            event.type === "beforematch" ? "find-in-page" : pressed ? "item-press" : "list-navigation";
          accepted = change("expanded", expanded, { reason, event }) && accepted;
        }
        let selected = true;
        if (value !== state.value) {
          selected = change("value", value, { reason: "item-press", event });
          accepted = selected && accepted;
        }
        reading = false;
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the Tree holds its own selection and open folders.
        if (!accepted) syncTree();
        else if (context.options().value !== undefined || context.options().expanded !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(syncTree);
        }
        // UI SDK's Tree selects the row a press or Enter lands on, so a file is opened only once it's selected.
        const row = event.target instanceof Element ? event.target.closest('[data-slot="tree-item"]') : null;
        const path = row
          ?.querySelector(':scope > [data-slot="tree-label"] > [data-file-tree-part="item"]')
          ?.getAttribute("data-path");
        const opened = pressed && key !== " " && !modified && selected && state.canSelect;
        if (opened && path && path === value && isFile(path)) select(path, event);
      },
      syncTree,
      treeState: (state) => treeState(state.label, state.items),
      bindItem: (el, path) => {
        if (known.has(path)) return;
        known.add(path);
        if (!mounting) void enter(el, "fade", { motion: store.get().motion });
      },
      bindRoot: (el) => {
        const release = holdTransitions(el);
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        syncTree();
        return () => {
          release();
          cancelAnimationFrame(frame);
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, FileTreeTreeState>({
      role: "group",
      state: (state, { api }) => api.treeState(state),
      attrs: (state) => ({
        "aria-label": state.label,
        "data-file-tree-part": "root",
        "data-motion": state.motion,
      }),
      // UI SDK's Tree reports its changes only through callbacks, which web fires as events that don't bubble, so the
      // root reads the Tree's controller as the press, key or find in page that changed it bubbles here.
      on: {
        click: (event, { api }) => api.read(event),
        keyup: (event, { api }) => api.read(event),
        beforematch: (event, { api }) => api.read(event),
      },
      bind: (el, { api }) => api.bindRoot(el),
    }),
    item: slot<ItemProps & BaseSlotProps, FileTreeRow>({
      props: { value: "string" },
      selects: own,
      state: (state, { key }) => rowAt(state, key),
      attrs: (state, { key }) => {
        const row = rowAt(state, key);
        return {
          "data-file-tree-part": "item",
          "data-path": key,
          "data-kind": row.folder ? "folder" : "file",
          "data-change": row.change,
        };
      },
      bind: (el, { api, key }) => api.bindItem(el, key),
    }),
    // The counts and the badge letter are generated content, so a row's visible text is its name, which its
    // accessible name starts with (WCAG 2.5.3), and the parts' labels give the words.
    counts: slot<ItemPartProps & BaseSlotProps>({
      role: "img",
      props: fromItem,
      selects: own,
      present: (state, { key }) => {
        const row = rowAt(state, key);
        return row.additions !== undefined || row.deletions !== undefined;
      },
      attrs: (state, { key }) => {
        const row = rowAt(state, key);
        return {
          "aria-label": countsLabel(row),
          "data-file-tree-part": "counts",
          "data-additions": row.additions === undefined ? undefined : `+${row.additions}`,
          "data-deletions": row.deletions === undefined ? undefined : `−${row.deletions}`,
        };
      },
    }),
    badge: slot<ItemPartProps & BaseSlotProps>({
      role: "img",
      props: fromItem,
      selects: own,
      present: (state, { key }) => rowAt(state, key).letter !== "",
      attrs: (state, { key }) => {
        const row = rowAt(state, key);
        return {
          "aria-label": row.change,
          "data-file-tree-part": "badge",
          "data-change": row.change,
          "data-letter": row.letter,
        };
      },
    }),
  }),
  // Folders and files are listed by path, so an agent can name one to `expand`, `collapse` or `select`.
  agent: {
    actions: ["expand", "collapse", "select"],
    items: (api: FileTreeApi) => {
      const { branches, leaves } = valuesOf(itemsOf(api.getEntries()));
      return [...branches, ...leaves].map((path) => ({ value: path, label: path }));
    },
    closed: true,
  },
});
