import {
  type ChangeDetails,
  createPopup,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPartState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupBackdrop,
  popupClose,
  popupContent,
  popupState,
  popupTitle,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
} from "@ui-sdk/core";
import { type DialogOpenChangeReason, dialogPreset } from "@ui-sdk/core/dialog";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { ariaKeyshortcuts, registerShortcut } from "@ui-sdk/core/shortcuts";
import type { MotionMode } from "../motion/index.js";
import { withAutoPresentation } from "../presentation.js";

/** How the panel presents: `"auto"` is a sheet on small touch screens, else a popover or, with `modal`, a dialog. */
export type LauncherPresentation = "auto" | "popover" | "dialog" | "sheet";

/** What opened or closed the panel. */
export type LauncherOpenChangeReason = PopoverOpenChangeReason | DialogOpenChangeReason;

/**
 * Where focus goes as the panel opens, unless its content says otherwise: the first composer's editor inside, else
 * the content itself.
 */
export const LAUNCHER_INITIAL_FOCUS = '[data-slot="kind-composer-input"] [data-slot="token-input-editor"]';

export type LauncherOptions = {
  /**
   * Names the panel and its title. The button is named "Open <label>" or "Close <label>".
   * @default "Assistant"
   */
  label?: string;
  /**
   * How many messages are unread. Above 0, a badge shows it and the button's name ends in ", N unread".
   * @default 0
   */
  unread?: number;
  /**
   * Opens the panel as a modal dialog in the middle of the screen, which makes the page inert. Without it, the panel
   * is a popover above the button and the page stays usable. Read when the launcher mounts.
   * @default false
   */
  modal?: boolean;
  /** Whether the panel is open. Passing it controls it. */
  open?: boolean;
  /**
   * Whether the panel starts open, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<LauncherOpenChangeReason>) => void;
  /**
   * Keys that open and close the panel from anywhere on the page, like `"mod+j"`. None by default. Keys the composer's
   * editor takes for itself, like `"mod+i"` for italics, can't close the panel from inside it.
   */
  shortcut?: string;
  /**
   * `"auto"` is a full-screen sheet on small touch screens, and a popover or dialog elsewhere.
   * @default "auto"
   */
  presentation?: LauncherPresentation;
  /**
   * At full motion the panel rises from the button and the glyph turns. Reduced motion only fades, in 120 ms.
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type LauncherState = PopupState & {
  /** The `label`, else "Assistant". */
  label: string;
  /** The `unread` count, a whole number of at least 0. */
  unread: number;
  /** The `shortcut` option. */
  shortcut: string | undefined;
  /** The shortcut's `aria-keyshortcuts`, which depends on the platform, so it's set once the button binds. */
  keyshortcuts: string | undefined;
  /** The `motion` option, `"auto"` without one. */
  motion: MotionMode;
};

type Popup = ReturnType<typeof createPopup<LauncherOptions, LauncherState, PopupPreset>>;

export type LauncherApi = Omit<Popup, "open" | "close"> & {
  /** Opens the panel. Offered while it's closed. */
  readonly open: (() => boolean) | undefined;
  /** Closes the panel. Offered while it's open. */
  readonly close: (() => boolean) | undefined;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<LauncherState, LauncherApi, Props, Public>;

type LauncherSlots = {
  root: Slot;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState>;
  badge: Slot<BaseSlotProps, { text: string }>;
  backdrop: Slot<BaseSlotProps, PopupPartState>;
  viewport: Slot;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  title: Slot<BaseSlotProps, { label: string }>;
  close: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type LauncherPrimitive = ReturnType<
  typeof definePrimitive<LauncherOptions, LauncherState, LauncherApi, LauncherSlots>
>;

const presentation = (options: LauncherOptions) => ({
  label: options.label || "Assistant",
  unread:
    options.unread !== undefined && Number.isFinite(options.unread)
      ? Math.max(0, Math.floor(options.unread))
      : 0,
  shortcut: options.shortcut || undefined,
  motion: options.motion ?? "auto",
});

/** The button's name: "Open Assistant" or "Close Assistant", with ", 2 unread" while messages are unread. */
export const launcherTriggerName = ({
  open,
  label,
  unread,
}: Pick<LauncherState, "open" | "label" | "unread">): string =>
  `${open ? "Close" : "Open"} ${label}${unread > 0 ? `, ${unread} unread` : ""}`;

export const launcherPrimitive: LauncherPrimitive = definePrimitive<
  LauncherOptions,
  LauncherState,
  LauncherApi,
  LauncherSlots
>({
  name: "kind-launcher",
  options: {
    label: "string",
    unread: "number",
    modal: "boolean",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    shortcut: "string",
    presentation: "string",
    motion: "string",
  },
  state: (options) => ({ ...popupState(options), ...presentation(options), keyshortcuts: undefined }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open"],
  api: (context) => {
    const { store } = context;
    const popup = createPopup<LauncherOptions, LauncherState, PopupPreset>(
      { ...context, options: () => withAutoPresentation(context.options()) },
      { preset: context.options().modal ? dialogPreset : popoverPreset },
    );
    return {
      ...popup,
      get open() {
        return store.get().open ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const content = popupContent(slot);
    const title = popupTitle(slot);
    const close = popupClose(slot);
    const backdrop = popupBackdrop(slot);
    return {
      root: slot({
        attrs: (state) => ({
          "data-launcher-part": "root",
          "data-open": state.open ? "" : undefined,
          "data-motion": state.motion,
        }),
      }),
      trigger: slot({
        ...trigger,
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "aria-label": launcherTriggerName(state),
          "aria-keyshortcuts": state.keyshortcuts,
          "data-launcher-part": "trigger",
          "data-open": state.open ? "" : undefined,
          "data-motion": state.motion,
        }),
        // The shortcut's keys depend on the platform, so they're read here rather than in server markup.
        bind: (el, part) => {
          const unbindTrigger = trigger.bind?.(el, part);
          const { store, api } = part;
          let registered: string | undefined;
          let unregister: (() => void) | undefined;
          const follow = () => {
            const { shortcut, label } = store.get();
            if (`${shortcut} ${label}` === registered) return;
            registered = `${shortcut} ${label}`;
            unregister?.();
            unregister = undefined;
            store.set({ keyshortcuts: shortcut && ariaKeyshortcuts(shortcut) });
            if (!shortcut) return;
            unregister = registerShortcut(shortcut, (event) => api.toggle({ reason: "shortcut", event }), {
              layer: el,
              description: `Open or close ${label}`,
            });
          };
          follow();
          const unsubscribe = store.subscribe(follow);
          return () => {
            unsubscribe();
            unregister?.();
            unbindTrigger?.();
          };
        },
      }),
      badge: slot<BaseSlotProps, { text: string }>({
        present: (state) => state.unread > 0,
        state: (state) => ({ text: state.unread > 99 ? "99+" : String(state.unread) }),
        attrs: () => ({ "aria-hidden": "true", "data-launcher-part": "badge" }),
      }),
      // Only a modal panel (or a sheet, which is modal) has one: over a popover it would take the page's presses.
      backdrop: slot({
        ...backdrop,
        present: (state, part) => state.modal === true && (backdrop.present?.(state, part) ?? true),
      }),
      // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
      viewport: popupViewport(slot),
      content: slot<PopupContentProps & BaseSlotProps, PopupContentState>({
        ...content,
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          "data-launcher-part": "content",
          "data-modal": state.modal === true ? "" : undefined,
          "data-motion": state.motion,
        }),
      }),
      title: slot<BaseSlotProps, { label: string }>({
        ...title,
        state: (state) => ({ label: state.label }),
        attrs: (state, part) => ({ ...title.attrs?.(state, part), "data-launcher-part": "title" }),
      }),
      close: slot({
        ...close,
        attrs: (state, part) => ({
          ...close.attrs?.(state, part),
          type: "button",
          "aria-label": `Close ${state.label}`,
          "data-launcher-part": "close",
        }),
      }),
    };
  },
  agent: { actions: ["open", "close"] },
});
