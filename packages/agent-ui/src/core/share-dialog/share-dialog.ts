import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createChange,
  createPopup,
  definePrimitive,
  dispatch,
  type PopupContentProps,
  type PopupContentState,
  type PopupPartState,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupBackdrop,
  popupClose,
  popupContent,
  popupDescription,
  popupState,
  popupTitle,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
} from "@ui-sdk/core";
import { type DialogOpenChangeReason, dialogPreset } from "@ui-sdk/core/dialog";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createSegmentedControlController,
  type SegmentedControlController,
} from "@ui-sdk/core/segmented-control";
import { actionSource } from "../action-source.js";
import { createCopy } from "../clipboard.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { withAutoPresentation } from "../presentation.js";

/** Who can open the chat: only its owner, or anyone with its link. */
export type ShareVisibility = "private" | "link";

/** `"input-change"`: a person chose. `"imperative"`: an `api` call, like an agent's `setVisibility`. */
export type ShareVisibilityChangeReason = "input-change" | "imperative";

/** Who pressed Create link or Stop sharing: the button, or a call to the api or an agent's. */
export type ShareDialogActionDetails = ActionDetails & {
  reason: "create-press" | "revoke-press" | "imperative";
};

/** `"sheet"` slides the dialog up from the bottom; `"auto"` does that on small touch screens. */
export type ShareDialogPresentation = "auto" | "dialog" | "sheet";

/** A choice of who can open the chat. */
export type ShareVisibilityOption = { value: ShareVisibility; label: string };

export type ShareDialogOptions = {
  /**
   * Names the trigger, and the component for agents.
   * @default "Share"
   */
  label?: string;
  /**
   * Titles the dialog.
   * @default "Share chat"
   */
  dialogLabel?: string;
  /** Who can open the chat. Passing it controls it: change it in `onVisibilityChange`. */
  visibility?: ShareVisibility;
  /**
   * Who can open the chat at first, when `visibility` isn't passed.
   * @default "private"
   */
  defaultVisibility?: ShareVisibility;
  /** Called when a person or `setVisibility` chooses who can open the chat, with why. */
  onVisibilityChange?: (
    visibility: ShareVisibility,
    details: ChangeDetails<ShareVisibilityChangeReason>,
  ) => void;
  /**
   * The chat's share link, which the host makes. The component never builds one: while `visibility` is `"link"` it
   * shows this, read-only, with Copy link.
   */
  link?: string;
  /**
   * Called when Create link is pressed. Shows Create link while set, `visibility` is `"link"` and there's no `link`.
   * Make the link and pass it as `link`; return a promise to keep Create link pending until it settles. If it rejects
   * or throws, the dialog shows and announces "Couldn't create a link", and Create link is offered again.
   */
  onCreateLink?: (details: ShareDialogActionDetails) => unknown;
  /**
   * Called when Stop sharing is pressed. Shows Stop sharing while set and there's a `link`. Revoke the link, then
   * clear `link` (and usually set `visibility` to `"private"`); a promise keeps it pending until it settles. If it
   * rejects or throws, the dialog shows and announces "Couldn't stop sharing".
   */
  onRevoke?: (details: ShareDialogActionDetails) => unknown;
  /** Called before Copy link writes `link` to the clipboard. `details.cancel()` keeps it from writing. */
  onCopy?: (link: string, details: ChangeDetails<"copy-press" | "imperative">) => void;
  /**
   * Whether an agent needs a person's go-ahead for every action, since sharing makes a chat visible to others.
   * Renders `data-agent-confirm` on the root.
   * @default true
   */
  agentConfirm?: boolean;
  /** Whether the dialog is open. Passing it controls it. */
  open?: boolean;
  /**
   * Whether the dialog is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<DialogOpenChangeReason>) => void;
  /**
   * How the dialog presents. `"auto"` is a bottom sheet on small touch screens and a centered dialog elsewhere.
   * @default "auto"
   */
  presentation?: ShareDialogPresentation;
  /**
   * The dialog rises in at full motion and only fades, in 120 ms, under reduced motion. `"auto"` follows
   * `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ShareDialogState = PopupState & {
  /** The `label`, else "Share". */
  label: string;
  /** The `dialogLabel`, else "Share chat". */
  dialogLabel: string;
  /** Who can open the chat. */
  visibility: ShareVisibility;
  /** The `link` option, `undefined` when empty. */
  link: string | undefined;
  /** Whether `onCreateLink` is set. */
  canCreate: boolean;
  /** Whether `onRevoke` is set. */
  canRevoke: boolean;
  /** Whether a promise `onCreateLink` or `onRevoke` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** Whether a create or revoke went through and the host hasn't changed `link` since, so it can't run again. */
  sent: boolean;
  /** What went wrong with the last create or revoke, until the next one. */
  error: string | undefined;
  /** Whether Copy link copied in the last 2 s. */
  copied: boolean;
  /** The `agentConfirm` option, `true` without one. */
  agentConfirm: boolean;
  /** The `motion` option, `"auto"` without one. */
  motion: MotionMode;
};

/** What the visibility part hands UI SDK's Segmented Control: pass every key but `options` to it. */
export type ShareDialogVisibilityState = {
  /** The primitive's own, which it reads and writes the visibility through. */
  controller: SegmentedControlController;
  /** The visibility when the Segmented Control mounted. */
  defaultValue: ShareVisibility;
  /** Names the radio group. */
  "aria-label": string;
  /** The choices to render, not a prop of the Segmented Control. */
  options: readonly ShareVisibilityOption[];
};

/** What the link part hands UI SDK's Input: pass every key to it. */
export type ShareDialogLinkState = { value: string; readOnly: true; "aria-label": string };

type Popup = ReturnType<typeof createPopup<ShareDialogOptions, ShareDialogState, typeof dialogPreset>>;

export type ShareDialogApi = Omit<Popup, "open" | "close"> & {
  /** Opens the dialog. Offered while it's closed. */
  readonly open: (() => boolean) | undefined;
  /** Closes the dialog. Offered while it's open. */
  readonly close: (() => boolean) | undefined;
  /** Chooses who can open the chat, as a person would. Offered while the dialog is open. */
  readonly setVisibility: ((visibility: ShareVisibility) => boolean) | undefined;
  /** Calls `onCreateLink`. Offered while the dialog is open, Create link shows and nothing is pending. */
  readonly createLink: ((event?: Event) => void) | undefined;
  /** Copies `link`. Offered while the dialog is open and shows the link. */
  readonly copyLink: ((event?: Event) => Promise<boolean>) | undefined;
  /** Calls `onRevoke`. Offered while the dialog is open, Stop sharing shows and nothing is pending. */
  readonly revoke: ((event?: Event) => void) | undefined;
  /** Who can open the chat. */
  getVisibility: () => ShareVisibility;
  /**
   * Chooses who can open the chat, whether or not the dialog is open, as a web element's `visibility` property does.
   * Returns `false` when the owner refuses the change.
   */
  changeVisibility: (visibility: ShareVisibility) => boolean;
  /** Reports the visibility a person chose. Called as the Segmented Control's `change` bubbles to its part. */
  readVisibility: (event: Event) => void;
  /** Hands the Segmented Control its props. Called by the visibility slot. */
  visibilityState: (state: ShareDialogState) => ShareDialogVisibilityState;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<ShareDialogState, ShareDialogApi, Props, Public>;

type ShareDialogSlots = {
  root: Slot;
  trigger: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState & { label: string }>;
  backdrop: Slot<BaseSlotProps, PopupPartState>;
  viewport: Slot;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  title: Slot<BaseSlotProps, { label: string }>;
  description: Slot<BaseSlotProps, { text: string }>;
  visibility: Slot<BaseSlotProps, ShareDialogVisibilityState>;
  link: Slot<BaseSlotProps, ShareDialogLinkState>;
  create: Slot;
  copy: Slot<BaseSlotProps, { copied: boolean }>;
  revoke: Slot;
  error: Slot<BaseSlotProps, { message: string }>;
  close: Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ShareDialogPrimitive = ReturnType<
  typeof definePrimitive<ShareDialogOptions, ShareDialogState, ShareDialogApi, ShareDialogSlots>
>;

export const SHARE_VISIBILITY_OPTIONS: readonly ShareVisibilityOption[] = [
  { value: "private", label: "Only you" },
  { value: "link", label: "Anyone with the link" },
];

/** What the dialog's description says for each visibility. */
export const SHARE_DIALOG_DESCRIPTIONS: Readonly<Record<ShareVisibility, string>> = {
  private: "Only you can open this chat.",
  link: "Anyone with the link can open this chat.",
};

const isVisibility = (value: unknown): value is ShareVisibility => value === "private" || value === "link";

const presentation = (options: ShareDialogOptions) => ({
  label: options.label || "Share",
  dialogLabel: options.dialogLabel || "Share chat",
  link: options.link || undefined,
  canCreate: options.onCreateLink !== undefined,
  canRevoke: options.onRevoke !== undefined,
  agentConfirm: options.agentConfirm ?? true,
  motion: options.motion ?? "auto",
});

const shows = {
  create: (state: ShareDialogState) => state.visibility === "link" && !state.link && state.canCreate,
  link: (state: ShareDialogState) => state.visibility === "link" && state.link !== undefined,
  revoke: (state: ShareDialogState) => state.link !== undefined && state.canRevoke,
};

const FAILURES = { onCreateLink: "Couldn't create a link", onRevoke: "Couldn't stop sharing" } as const;

export const shareDialogPrimitive: ShareDialogPrimitive = definePrimitive<
  ShareDialogOptions,
  ShareDialogState,
  ShareDialogApi,
  ShareDialogSlots
>({
  name: "kind-share-dialog",
  options: {
    label: "string",
    dialogLabel: "string",
    visibility: "string",
    defaultVisibility: "string",
    onVisibilityChange: "callback",
    link: "string",
    onCreateLink: "action",
    onRevoke: "action",
    onCopy: "callback",
    agentConfirm: "boolean",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    presentation: "string",
    motion: "string",
  },
  state: (options) => ({
    ...popupState({ open: options.open ?? options.defaultOpen ?? false }),
    ...presentation(options),
    visibility: isVisibility(options.visibility)
      ? options.visibility
      : isVisibility(options.defaultVisibility)
        ? options.defaultVisibility
        : "private",
    pending: false,
    sent: false,
    error: undefined,
    copied: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(isVisibility(options.visibility) ? { visibility: options.visibility } : {}),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["open", "visibility"],
  api: (context) => {
    const { store } = context;
    const popup = createPopup<ShareDialogOptions, ShareDialogState, typeof dialogPreset>(
      { ...context, options: () => withAutoPresentation(context.options()) },
      { preset: dialogPreset },
    );
    const change = createChange(context);
    const pending = createPendingAction(context, { state: "pending" });
    const copy = createCopy(context);
    const controller = createSegmentedControlController();

    const syncVisibility = () => {
      const { visibility } = store.get();
      // The controller reads `undefined` until a Segmented Control attaches it.
      const shown = controller.getValue();
      if (shown !== undefined && shown !== visibility) controller.setValue(visibility);
    };
    // A create or revoke that went through stays locked until the host passes the link it made or cleared.
    let link = store.get().link;
    store.subscribe(() => {
      const state = store.get();
      if (state.link !== link) {
        link = state.link;
        if (state.sent) return store.set({ sent: false });
      }
      syncVisibility();
    });

    const run = (name: "onCreateLink" | "onRevoke", event: Event | undefined) => {
      const call = context.options()[name];
      if (!call) return;
      const reason = !event ? "imperative" : name === "onCreateLink" ? "create-press" : "revoke-press";
      const details = { reason, source: actionSource(event, reason) } as const;
      store.set({ error: undefined });
      const before = store.get().link;
      void pending
        .run(() => call(details))
        ?.then((outcome) => {
          // A host that passed the new link before its promise settled has already unlocked it.
          if (outcome === "done" && store.get().link === before) store.set({ sent: true });
          if (outcome !== "failed") return;
          store.set({ error: FAILURES[name] });
          announce(FAILURES[name], { priority: "polite" });
        });
    };
    const runnable = (shown: (state: ShareDialogState) => boolean) => {
      const state = store.get();
      return state.open && !state.pending && !state.sent && shown(state);
    };

    const setVisibility = (visibility: ShareVisibility, event?: Event) => {
      const state = store.get();
      if (!isVisibility(visibility)) return false;
      if (visibility === state.visibility) return true;
      return change(
        "visibility",
        visibility,
        event ? { reason: "input-change", event } : { reason: "imperative" },
      );
    };
    const copyLink = async (event?: Event) => {
      const { link } = store.get();
      if (!link) return false;
      const details = event ? { reason: "copy-press" as const, event } : { reason: "imperative" as const };
      if (dispatch(context, "onCopy", link, details)) return false;
      return copy(link);
    };

    const visibilityState = memo(
      (visibility: ShareVisibility): ShareDialogVisibilityState => ({
        controller,
        defaultValue: visibility,
        "aria-label": "Who can open this chat",
        options: SHARE_VISIBILITY_OPTIONS,
      }),
    );

    return {
      ...popup,
      get open() {
        return store.get().open ? undefined : () => popup.setOpen(true);
      },
      get close() {
        return store.get().open ? () => popup.setOpen(false) : undefined;
      },
      get setVisibility() {
        return store.get().open ? (visibility: ShareVisibility) => setVisibility(visibility) : undefined;
      },
      getVisibility: () => store.get().visibility,
      changeVisibility: (visibility) => setVisibility(visibility),
      get createLink() {
        return runnable(shows.create) ? (event?: Event) => run("onCreateLink", event) : undefined;
      },
      get copyLink() {
        return store.get().open && shows.link(store.get()) ? copyLink : undefined;
      },
      get revoke() {
        return runnable(shows.revoke) ? (event?: Event) => run("onRevoke", event) : undefined;
      },
      readVisibility: (event) => {
        const next = controller.getValue();
        if (!isVisibility(next) || next === store.get().visibility) return;
        // The Segmented Control holds its own value, so a change the owner cancels or doesn't take is written back.
        setVisibility(next, event);
        syncVisibility();
      },
      visibilityState: (state) => visibilityState(state.visibility),
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const backdrop = popupBackdrop(slot);
    const content = popupContent(slot);
    const title = popupTitle(slot);
    const description = popupDescription(slot);
    const close = popupClose(slot);
    const action = (name: "create" | "revoke") =>
      slot({
        role: "button",
        focus: "native",
        present: shows[name],
        press: ({ api }, event) => (name === "create" ? api.createLink : api.revoke)?.(event),
        attrs: (state) => ({
          type: "button",
          "aria-disabled": state.pending || state.sent ? "true" : undefined,
          "data-pending": state.pending ? "" : undefined,
          "data-share-dialog-part": name,
        }),
      });
    return {
      // A group named by the label, since the agent bridge names a component by its root.
      root: slot({
        role: "group",
        attrs: (state) => ({
          "aria-label": state.label,
          "data-share-dialog-part": "root",
          "data-motion": state.motion,
          "data-agent-confirm": state.agentConfirm ? "Makes this chat visible to others" : undefined,
        }),
      }),
      trigger: slot({
        ...trigger,
        state: (state, part) => ({
          ...(trigger.state?.(state, part) as PopupTriggerState),
          label: state.label,
        }),
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          type: "button",
          "data-share-dialog-part": "trigger",
        }),
      }),
      backdrop: slot({
        ...backdrop,
        attrs: (state, part) => ({
          ...backdrop.attrs?.(state, part),
          "data-share-dialog-part": "backdrop",
          "data-motion": state.motion,
        }),
      }),
      // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
      viewport: popupViewport(slot),
      content: slot({
        ...content,
        attrs: (state, part) => ({
          ...content.attrs?.(state, part),
          "data-share-dialog-part": "content",
          "data-visibility": state.visibility,
          "data-motion": state.motion,
        }),
      }),
      title: slot({
        ...title,
        state: (state) => ({ label: state.dialogLabel }),
        attrs: (state, part) => ({ ...title.attrs?.(state, part), "data-share-dialog-part": "title" }),
      }),
      description: slot({
        ...description,
        state: (state) => ({ text: SHARE_DIALOG_DESCRIPTIONS[state.visibility] }),
        attrs: (state, part) => ({
          ...description.attrs?.(state, part),
          "data-share-dialog-part": "description",
        }),
      }),
      visibility: slot({
        state: (state, { api }) => api.visibilityState(state),
        attrs: () => ({ "data-share-dialog-part": "visibility" }),
        // UI SDK's Segmented Control fires a native `change` that bubbles, as native radios do.
        on: { change: (event, { api }) => api.readVisibility(event) },
      }),
      link: slot({
        present: shows.link,
        state: (state) => ({ value: state.link ?? "", readOnly: true as const, "aria-label": "Link" }),
        attrs: () => ({ "data-share-dialog-part": "link" }),
      }),
      create: action("create"),
      copy: slot({
        role: "button",
        focus: "native",
        present: shows.link,
        press: ({ api }, event) => void api.copyLink?.(event),
        state: (state) => ({ copied: state.copied }),
        attrs: (state) => ({
          type: "button",
          "data-copied": state.copied ? "" : undefined,
          "data-share-dialog-part": "copy",
        }),
      }),
      revoke: action("revoke"),
      error: slot({
        present: (state) => state.error !== undefined,
        state: (state) => ({ message: state.error ?? "" }),
        attrs: () => ({ "data-share-dialog-part": "error" }),
      }),
      close: slot({
        ...close,
        attrs: (state, part) => ({
          ...close.attrs?.(state, part),
          type: "button",
          "data-share-dialog-part": "close",
        }),
      }),
    };
  },
  agent: {
    actions: ["open", "close", "setVisibility", "createLink", "copyLink", "revoke"],
    items: () => SHARE_VISIBILITY_OPTIONS.map((option) => ({ ...option })),
    closed: true,
  },
});
