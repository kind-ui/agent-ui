import {
  ariaKeyshortcuts,
  bindViewport,
  type ChangeDetails,
  createChange,
  css,
  definePrimitive,
  formatShortcut,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { DrawerOpenChangeReason } from "@ui-sdk/core/drawer";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createResizableController,
  type ResizableController,
  type ResizableLayoutChangeReason,
  type ResizableSize,
  type ResizableStorage,
  resizableStorageKey,
} from "@ui-sdk/core/resizable";
import { registerShortcut } from "@ui-sdk/core/shortcuts";
import { hearComposed } from "../composed-events.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";

/**
 * Why the sidebar opened or closed. `"trigger-press"`: its trigger. `"handle"`: Enter, Home or End on the resize
 * handle, or a double-click on it. `"drag"`: the handle dragged past the panel's midpoint, or the drawer swiped shut.
 * `"shortcut"`: the `shortcut`. `"outside-press"` and `"escape-key"`: the drawer dismissed. `"breakpoint"`: the
 * window crossed `overlayBelow`, which closes the drawer the panel turns into and gives the panel back its own
 * state. `"imperative"`: an `api` call, like an agent's `open`.
 */
export type SidebarOpenChangeReason =
  | "trigger-press"
  | "handle"
  | "drag"
  | "shortcut"
  | "outside-press"
  | "escape-key"
  | "breakpoint"
  | "imperative";

/** The edge a sidebar's panel sits on: `"start"` and `"end"` follow the writing direction. */
export type SidebarSide = "start" | "end";

export type SidebarOptions = {
  /**
   * The edge the panel sits on, which the drawer comes from on narrow screens. `"start"` and `"end"` follow the
   * writing direction. Write the parts in reading order: the panel first for `"start"`, the inset first for `"end"`.
   * @default "start"
   */
  side?: SidebarSide;
  /**
   * Names the panel, its resize handle ("Resize Chats") and its trigger ("Hide Chats").
   * @default "Sidebar"
   */
  label?: string;
  /** Whether the panel is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the panel starts open, when `open` isn't passed. The drawer on a narrow screen always starts closed.
   * @default true
   */
  defaultOpen?: boolean;
  /** Called when a person, the shortcut, the window or an `api` call opens or closes the panel, with why. */
  onOpenChange?: (open: boolean, details: ChangeDetails<SidebarOpenChangeReason>) => void;
  /**
   * The panel's width at first: pixels, rem or a percentage of the sidebar.
   * @default "280px"
   */
  defaultSize?: ResizableSize;
  /**
   * The narrowest the open panel gets. Pixel and rem sizes hold as the window resizes.
   * @default "220px"
   */
  minSize?: ResizableSize;
  /**
   * The widest the panel gets.
   * @default "420px"
   */
  maxSize?: ResizableSize;
  /**
   * The panel's width while closed: 0 hides it, a rail width like `"48px"` keeps its icons in view.
   * @default "0px"
   */
  collapsedSize?: ResizableSize;
  /**
   * Saves the panel's width and whether it's open when a person resizes or collapses it, and restores them on the
   * next visit, under this key. An uncontrolled sidebar takes the saved state over `defaultOpen`. Read once, when the
   * sidebar is created.
   */
  storageKey?: string;
  /** Where `storageKey` saves: anything with `getItem` and `setItem`, like a cookie a server can read. */
  storage?: ResizableStorage;
  /**
   * The media query under which the panel turns into a modal drawer, read in the browser. An empty string keeps
   * the panel beside the page at every width.
   * @default "(max-width: 767px)"
   */
  overlayBelow?: string;
  /** A shortcut that opens and closes the panel, like `"mod+b"`. `mod` is Command on Apple platforms. */
  shortcut?: string;
  /**
   * How the panel moves when its trigger, the shortcut or an `api` call opens or closes it: it slides at full
   * motion, while the page beside it changes width once, and snaps under reduced motion, and never while a person drags the handle. `"auto"` follows
   * `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type SidebarState = {
  /** Whether the panel, or on a narrow screen the drawer, is open. */
  open: boolean;
  /** Whether the window is under `overlayBelow`, so the panel is a drawer. Read in the browser. */
  overlay: boolean;
  /** The `side` option, else `"start"`. */
  side: SidebarSide;
  /** The `label` option, else "Sidebar". */
  label: string;
  /** The `shortcut` option. */
  shortcut: string | undefined;
  /** Whether the root has bound, so platform-dependent text, like the shortcut's keys, can show. */
  bound: boolean;
  /** Whether the panel is sliding because its trigger, the shortcut or an `api` call changed `open`. */
  animating: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** The `defaultSize` option, else `"280px"`. */
  defaultSize: ResizableSize;
  /** The `minSize` option, else `"220px"`. */
  minSize: ResizableSize;
  /** The `maxSize` option, else `"420px"`. */
  maxSize: ResizableSize;
  /** The `collapsedSize` option, else `"0px"`. */
  collapsedSize: ResizableSize;
  /** The panel's open width in pixels while it slides, which its content keeps. */
  slideWidth: number | undefined;
  /** The `storageKey` option. */
  storageKey: string | undefined;
  /** The `storage` option. */
  storage: ResizableStorage | undefined;
};

type LayoutCommitDetails = { reason: ResizableLayoutChangeReason; event?: Event | undefined };
type DrawerChangeDetails = { reason: DrawerOpenChangeReason; event?: Event | undefined; cancel: () => void };

/** What the root hands UI SDK Resizable, which it renders around the parts while the panel is beside the page. */
export type SidebarRootState = {
  /** Whether the panel is a drawer, so there is no Resizable. */
  overlay: boolean;
  /** Pass every key to the Resizable. */
  resizable: {
    controller: ResizableController;
    autoSaveId: string | undefined;
    storage: ResizableStorage | undefined;
    onLayoutCommit: (layout: number[], details: LayoutCommitDetails) => void;
  };
};

/** What the panel hands the Resizable panel or the Drawer it renders inside. */
export type SidebarPanelState = {
  /** Whether the panel is a drawer: render it inside `drawer` and `drawerContent`, else inside `resizablePanel`. */
  overlay: boolean;
  /** Whether the panel is open. */
  open: boolean;
  /** Pass every key to the Resizable panel. */
  resizablePanel: {
    id: string;
    defaultSize: ResizableSize;
    minSize: ResizableSize;
    maxSize: ResizableSize;
    collapsible: true;
    collapsedSize: ResizableSize;
    "data-sidebar-frame": "panel";
  };
  /** Pass every key to the Drawer. */
  drawer: {
    open: boolean;
    side: SidebarSide;
    modal: true;
    onOpenChange: (open: boolean, details: DrawerChangeDetails) => void;
  };
  /** Pass every key to the Drawer's content, which stays in the page while closed so the panel keeps its state. */
  drawerContent: { "aria-label": string; keepMounted: true };
};

/** What the inset hands the Resizable panel it renders inside while the panel is beside the page. */
export type SidebarInsetState = {
  /** Whether the panel is a drawer, so the inset renders on its own. */
  overlay: boolean;
  /** Pass every key to the Resizable panel. */
  resizablePanel: { id: string; "data-sidebar-frame": "inset" };
};

/** What the handle part hands UI SDK's Resizable handle, which it wraps. */
export type SidebarHandleState = { "aria-label": string };

/** What the trigger hands its render function. */
export type SidebarTriggerState = {
  /** Whether the panel is open. */
  open: boolean;
  /** The shortcut's keys as this platform writes them, like "⌘B", once the root has bound. */
  shortcutLabel: string | undefined;
};

export type SidebarApi = {
  /** Opens the panel, offered while it's closed. */
  readonly open: (() => void) | undefined;
  /** Closes the panel, offered while it's open. */
  readonly close: (() => void) | undefined;
  /** Whether the panel is open. */
  isOpen: () => boolean;
  /** Opens or closes the panel, as an `api` call. Returns `false` for a refused change. */
  setOpen: (open: boolean) => boolean;
  /** Opens a closed panel and closes an open one. Called by the trigger and the shortcut. */
  toggle: (reason: "trigger-press" | "shortcut", event?: Event) => void;
  /** Reports a layout change a person made on the handle. Called by the Resizable's `onLayoutCommit`. */
  layoutCommit: (reason: ResizableLayoutChangeReason, event?: Event) => void;
  /** Reports the drawer opening or closing itself. Called by the Drawer's `onOpenChange`. */
  drawerChange: (
    open: boolean,
    reason: DrawerOpenChangeReason,
    event: Event | undefined,
    cancel: () => void,
  ) => void;
  /** Follows `overlayBelow`, the shortcut and, on Web Components, the composed Resizable's and Drawer's events. */
  bindRoot: (el: HTMLElement) => () => void;
  /** Brings a Resizable that just attached to `open`. Called as the panel binds. */
  bindPanel: () => void;
  /** The props the root hands the Resizable, the same object while they're unchanged. */
  rootState: (state: SidebarState) => SidebarRootState;
  /** The props the panel hands the Resizable panel or the Drawer, the same object while they're unchanged. */
  panelState: (state: SidebarState) => SidebarPanelState;
  /** The props the inset hands its Resizable panel. */
  insetState: (state: SidebarState) => SidebarInsetState;
  /** The handle's name. */
  handleState: (state: SidebarState) => SidebarHandleState;
  /** What the trigger's render function gets. */
  triggerState: (state: SidebarState) => SidebarTriggerState;
};

type Slot<Extra> = SlotDefinition<SidebarState, SidebarApi, BaseSlotProps, Extra>;

type SidebarSlots = {
  root: Slot<SidebarRootState>;
  // `heading`, not `panel`: UI SDK's agent bridge names a component by its `heading` part when no keyless `group` or
  // root part has a name, and the root holds the whole page, so the panel's name ("Chats") names the sidebar. Not
  // `group`, which every web part's auto key hides from the bridge, nor `title`, whose whole text (every thread in
  // the panel) the bridge copies into the snapshot entry.
  heading: Slot<SidebarPanelState>;
  handle: Slot<SidebarHandleState>;
  inset: Slot<SidebarInsetState>;
  trigger: Slot<SidebarTriggerState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SidebarPrimitive = ReturnType<
  typeof definePrimitive<SidebarOptions, SidebarState, SidebarApi, SidebarSlots>
>;

const DRAWER_REASONS = new Set<string>(["trigger-press", "outside-press", "escape-key", "shortcut"]);
const DEFAULT_OVERLAY = "(max-width: 767px)";

const presentation = (options: SidebarOptions) => ({
  side: options.side ?? "start",
  label: options.label ?? "Sidebar",
  shortcut: options.shortcut || undefined,
  motion: options.motion ?? "auto",
  defaultSize: options.defaultSize ?? "280px",
  minSize: options.minSize ?? "220px",
  maxSize: options.maxSize ?? "420px",
  collapsedSize: options.collapsedSize ?? "0px",
  storageKey: options.storageKey,
  storage: options.storage,
});

const overlayMatches = (query: string) =>
  query !== "" && typeof matchMedia === "function" && matchMedia(query).matches;

const hasSaved = (key: string | undefined, storage: ResizableStorage | undefined) => {
  if (!key) return false;
  try {
    return (storage ?? globalThis.localStorage)?.getItem(resizableStorageKey(key)) != null;
  } catch {
    return false;
  }
};

export const sidebarPrimitive: SidebarPrimitive = definePrimitive<
  SidebarOptions,
  SidebarState,
  SidebarApi,
  SidebarSlots
>({
  name: "kind-sidebar",
  options: {
    side: "string",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    defaultSize: "string",
    minSize: "string",
    maxSize: "string",
    collapsedSize: "string",
    storageKey: "string",
    storage: "value",
    overlayBelow: "string",
    shortcut: "string",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? true,
    overlay: false,
    bound: false,
    animating: false,
    slideWidth: undefined,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open", "overlay"],
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const controller = createResizableController();
    // Saved layouts are keyed by the panels' ids, so a `storageKey` gives them ids that stay across visits.
    const base = context.options().storageKey ?? context.id;
    const panelId = `${base}-sidebar`;
    const insetId = `${base}-inset`;
    let firstAttach = true;
    // Whether the panel beside the page was open before it became a drawer, so crossing back restores it.
    let wideOpen = store.get().open;
    let frames: number[] = [];
    let destroyed = false;
    const later = (run: () => void) => {
      const frame = requestAnimationFrame(() => {
        frames = frames.filter((other) => other !== frame);
        if (!destroyed) run();
      });
      frames.push(frame);
    };
    context.onDestroy(() => {
      destroyed = true;
      for (const frame of frames) cancelAnimationFrame(frame);
    });

    const controlled = () => context.options().open !== undefined;
    // A controller no Resizable has attached returns `undefined`, as while the panel is a drawer.
    const attached = () => (controller.getLayout()?.length ?? 0) > 0;
    const panelOpen = () => !controller.isCollapsed(panelId);

    // The panel's open width, which its content keeps while it slides, so it clips rather than wrapping again.
    const openWidth = (panel: HTMLElement) => {
      const group = panel.closest<HTMLElement>('[data-slot="resizable"]');
      const share = controller.getLayout()?.[store.get().side === "end" ? 1 : 0];
      return group && share !== undefined ? (share / 100) * group.clientWidth : panel.offsetWidth;
    };

    // The slide's transitions need `data-animating` in the page before the size changes, and React writes it a
    // render later, so the change waits a frame and reads `open` then. A toggle mid-slide retargets the
    // transition from where it is, and `animating` clears once the latest one ends.
    let slide = 0;
    const animate = () => {
      const current = ++slide;
      if (!store.get().animating) store.set({ animating: true });
      later(() => {
        const { open, overlay } = store.get();
        const panel = context.element("heading");
        if (!overlay && attached() && open !== panelOpen()) {
          const from = panel?.offsetWidth ?? 0;
          if (open) controller.expand(panelId);
          else controller.collapse(panelId);
          if (panel) store.set({ slideWidth: Math.max(from, openWidth(panel)) });
        }
        later(() => {
          const running = (context.element("root")?.getAnimations({ subtree: true }) ?? []).filter(
            (animation) =>
              animation instanceof CSSTransition &&
              (animation.transitionProperty === "flex-basis" || animation.transitionProperty === "translate"),
          );
          void Promise.all(running.map((animation) => animation.finished.catch(() => undefined))).then(() => {
            if (!destroyed && current === slide) store.set({ animating: false, slideWidth: undefined });
          });
        });
      });
    };

    // Brings the panel beside the page to `open`, which the host owns when it passes `open`.
    const sync = () => {
      const state = store.get();
      if (state.overlay || !attached() || state.open === panelOpen()) return;
      animate();
    };
    store.subscribe(sync);

    // A Resizable that just attached starts at the panel's `defaultSize`, or the layout it saved.
    const attach = () => {
      if (store.get().overlay || !attached()) return;
      const first = firstAttach;
      firstAttach = false;
      const open = panelOpen();
      if (open === store.get().open) return;
      const { storageKey, storage } = context.options();
      if (first && !controlled() && hasSaved(storageKey, storage)) store.set({ open });
      else if (store.get().open) controller.expand(panelId);
      else controller.collapse(panelId);
    };

    const setOpen = (open: boolean, details: { reason: SidebarOpenChangeReason; event?: Event }) => {
      if (open === store.get().open) return false;
      return change("open", open, details);
    };

    // A sidebar that binds under `overlayBelow` starts with its drawer closed, which only a controlling owner hears.
    const setOverlay = (overlay: boolean, binding = false) => {
      if (overlay === store.get().overlay) return;
      if (overlay) wideOpen = store.get().open;
      store.set({ overlay });
      const open = overlay ? false : wideOpen;
      if (store.get().open === open) return;
      if (binding && !controlled()) store.set({ open });
      else setOpen(open, { reason: "breakpoint" });
    };
    let query = DEFAULT_OVERLAY;
    const checkOverlay = (binding = false) => {
      query = context.options().overlayBelow ?? DEFAULT_OVERLAY;
      setOverlay(overlayMatches(query), binding);
    };
    context.onOptions((options) => {
      if (store.get().bound && (options.overlayBelow ?? DEFAULT_OVERLAY) !== query) checkOverlay();
    });

    const rootState = memo(
      (autoSaveId: string | undefined, storage: ResizableStorage | undefined, overlay: boolean) => ({
        overlay,
        resizable: {
          controller,
          autoSaveId,
          storage,
          onLayoutCommit: (_layout: number[], details: LayoutCommitDetails) =>
            api.layoutCommit(details.reason, details.event),
        },
      }),
    );
    const panelState = memo(
      (
        overlay: boolean,
        open: boolean,
        side: SidebarSide,
        label: string,
        defaultSize: ResizableSize,
        minSize: ResizableSize,
        maxSize: ResizableSize,
        collapsedSize: ResizableSize,
      ): SidebarPanelState => ({
        overlay,
        open,
        resizablePanel: {
          id: panelId,
          defaultSize,
          minSize,
          maxSize,
          collapsible: true,
          collapsedSize,
          "data-sidebar-frame": "panel",
        },
        drawer: {
          open: overlay && open,
          side,
          modal: true,
          onOpenChange: (next, details) =>
            api.drawerChange(next, details.reason, details.event, details.cancel),
        },
        drawerContent: { "aria-label": label, keepMounted: true },
      }),
    );
    const insetState = memo((overlay: boolean) => ({
      overlay,
      resizablePanel: { id: insetId, "data-sidebar-frame": "inset" as const },
    }));
    const handleState = memo((label: string) => ({ "aria-label": `Resize ${label}` }));
    const triggerState = memo(
      (open: boolean, shortcutLabel: string | undefined): SidebarTriggerState => ({ open, shortcutLabel }),
    );

    const api: SidebarApi = {
      get open() {
        return store.get().open ? undefined : () => void setOpen(true, { reason: "imperative" });
      },
      get close() {
        return store.get().open ? () => void setOpen(false, { reason: "imperative" }) : undefined;
      },
      isOpen: () => store.get().open,
      setOpen: (open) => setOpen(open, { reason: "imperative" }),
      toggle: (reason, event) => void setOpen(!store.get().open, event ? { reason, event } : { reason }),
      layoutCommit: (reason, event) => {
        if (store.get().overlay || reason === "imperative" || reason === "resize") return;
        const open = panelOpen();
        if (open === store.get().open) return;
        const ours = reason === "drag" ? "drag" : "handle";
        // A refused change is undone, and so is one a controlling owner didn't take by the next frame.
        if (!setOpen(open, event ? { reason: ours, event } : { reason: ours })) sync();
        else if (controlled()) later(sync);
      },
      drawerChange: (open, reason, event, cancel) => {
        if (open === store.get().open) return;
        const ours: SidebarOpenChangeReason = DRAWER_REASONS.has(reason)
          ? (reason as SidebarOpenChangeReason)
          : reason === "swipe"
            ? "drag"
            : "imperative";
        setOpen(open, event ? { reason: ours, event } : { reason: ours });
        // `open` drives the drawer, so a change the owner didn't take is cancelled. One it took isn't: a web
        // Drawer that `open` was written to while it reported keeps its old value when the report is cancelled.
        if (store.get().open !== open) cancel();
      },
      bindRoot: (el) => {
        store.set({ bound: true });
        checkOverlay(true);
        // The query is read again whenever the viewport changes size, since UI SDK has no media query helper.
        const unbindViewport = bindViewport(el, { onChange: () => checkOverlay() });
        const unregister = registerShortcut(
          () => store.get().shortcut,
          (event) => api.toggle("shortcut", event),
        );
        const ours = (event: Event) =>
          event.target instanceof Element && event.target.closest("kind-sidebar") === el;
        const unhear = hearComposed(el, {
          layoutcommit: (detail, event) => {
            if (ours(event)) api.layoutCommit((detail as LayoutCommitDetails).reason, event);
          },
          openchange: (detail, event) => {
            if (!ours(event) || (event.target as Element).localName !== "ui-drawer") return;
            const {
              value,
              reason,
              event: cause,
            } = detail as { value: boolean } & LayoutCommitDetails & {
                reason: DrawerOpenChangeReason;
              };
            api.drawerChange(value, reason, cause, () => event.preventDefault());
          },
        });
        return () => {
          unbindViewport();
          unregister();
          unhear();
        };
      },
      bindPanel: () => later(attach),
      rootState: (state) => rootState(state.storageKey, state.storage, state.overlay),
      panelState: (state) =>
        panelState(
          state.overlay,
          state.open,
          state.side,
          state.label,
          state.defaultSize,
          state.minSize,
          state.maxSize,
          state.collapsedSize,
        ),
      insetState: (state) => insetState(state.overlay),
      handleState: (state) => handleState(state.label),
      triggerState: (state) =>
        triggerState(state.open, state.bound && state.shortcut ? formatShortcut(state.shortcut) : undefined),
    };
    return api;
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, SidebarRootState>({
      state: (state, { api }) => api.rootState(state),
      attrs: (state) => ({
        "data-sidebar-part": "root",
        "data-side": state.side,
        "data-open": state.open ? "" : undefined,
        "data-overlay": state.overlay ? "" : undefined,
        "data-bound": state.bound ? "" : undefined,
        "data-animating": state.animating ? "" : undefined,
        "data-motion": state.motion,
      }),
      bind: (el, { api }) => api.bindRoot(el),
    }),
    heading: slot<BaseSlotProps, SidebarPanelState>({
      // React renders an `aside`; a web `kind-sidebar-panel` needs the role written.
      role: "complementary",
      state: (state, { api }) => api.panelState(state),
      attrs: (state, part) => ({
        id: `${part.id}-panel`,
        "aria-label": state.label,
        "data-sidebar-part": "panel",
        "data-side": state.side,
        "data-open": state.open ? "" : undefined,
        "data-overlay": state.overlay ? "" : undefined,
        "data-rail": Number.parseFloat(String(state.collapsedSize)) > 0 ? "" : undefined,
        style: css({
          "--kind-sidebar-slide-width": state.slideWidth === undefined ? undefined : `${state.slideWidth}px`,
        }),
      }),
      bind: (_el, { api }) => api.bindPanel(),
    }),
    // Wraps UI SDK's Resizable handle, which is the separator.
    handle: slot<BaseSlotProps, SidebarHandleState>({
      present: (state) => !state.overlay,
      state: (state, { api }) => api.handleState(state),
      attrs: () => ({ "data-sidebar-part": "handle" }),
    }),
    inset: slot<BaseSlotProps, SidebarInsetState>({
      state: (state, { api }) => api.insetState(state),
      attrs: (state) => ({ "data-sidebar-part": "inset", "data-overlay": state.overlay ? "" : undefined }),
    }),
    trigger: slot<BaseSlotProps, SidebarTriggerState>({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.toggle("trigger-press", event),
      state: (state, { api }) => api.triggerState(state),
      attrs: (state, part) => ({
        type: "button",
        "aria-label": `${state.open ? "Hide" : "Show"} ${state.label}`,
        "aria-expanded": state.open ? "true" : "false",
        "aria-controls": `${part.id}-panel`,
        "aria-keyshortcuts": state.bound && state.shortcut ? ariaKeyshortcuts(state.shortcut) : undefined,
        "data-sidebar-part": "trigger",
        "data-side": state.side,
        "data-open": state.open ? "" : undefined,
      }),
    }),
  }),
  agent: { actions: ["open", "close"] },
});
