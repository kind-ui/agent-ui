import {
  type ActionDetails,
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  createPopup,
  definePrimitive,
  type PopupContentProps,
  type PopupContentState,
  type PopupPreset,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  popupContent,
  popupState,
  popupTitle,
  popupTrigger,
  type SlotDefinition,
} from "@ui-sdk/core";
import { createInputController, type InputController } from "@ui-sdk/core/input";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { createToggleGroupController, type ToggleGroupController } from "@ui-sdk/core/toggle";
import { actionSource } from "../action-source.js";
import { memo } from "../memo.js";
import { enter, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";

/** A thumbs up or down, or `null` for no rating. */
export type FeedbackRating = "up" | "down" | null;

/** `"item-press"`: a person pressed a thumb. `"imperative"`: an `api` call, like an agent's `rate`. */
export type FeedbackRatingChangeReason = "item-press" | "imperative";

/**
 * Called with the comment. Return a promise to keep Send disabled and the box open until it settles: a resolve closes
 * the box and empties it, a rejection keeps the text and shows an error. `details.source` says who sent it, like
 * `"mouse"`, `"keyboard"` or `"agent"`.
 */
export type FeedbackCommentCallback = (text: string, details: ActionDetails) => unknown;

export type FeedbackOptions = {
  /** The rating. Passing it controls it: change it in `onRatingChange`. */
  rating?: FeedbackRating;
  /**
   * The rating at first, when `rating` isn't passed.
   * @default null
   */
  defaultRating?: FeedbackRating;
  /** Called when a person or `rate` changes the rating, with why. Pressing the pressed thumb clears it. */
  onRatingChange?: (rating: FeedbackRating, details: ChangeDetails<FeedbackRatingChangeReason>) => void;
  /** Called with a comment. While set, "Add a comment" shows once there's a rating and opens a box to write one. */
  onComment?: FeedbackCommentCallback;
  /**
   * Whether the host has the comment: "Thanks for your feedback" replaces "Add a comment".
   * @default false
   */
  commentSent?: boolean;
  /**
   * Names the feedback.
   * @default "Feedback"
   */
  label?: string;
  /** Whether the comment box is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the comment box is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the comment box opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<PopoverOpenChangeReason>) => void;
  /**
   * How the comment box opens and "Add a comment" and the thanks appear: at full motion the box rises in; reduced
   * motion only fades. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type FeedbackState = PopupState & {
  /** The `label`, else "Feedback". */
  label: string;
  /** The rating. */
  rating: FeedbackRating;
  /** Whether `onComment` is set. */
  canComment: boolean;
  /** The `commentSent` option. */
  commentSent: boolean;
  /** The comment box's text. */
  commentText: string;
  /** Whether a promise `onComment` returned is still pending. */
  pending: boolean;
  /** Whether the last comment failed to send. */
  failed: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What the thumbs part hands UI SDK's Toggle group: pass every key to it. */
export type FeedbackThumbsState = {
  /** The primitive's own, which it reads and writes the rating through. */
  controller: ToggleGroupController;
  /** The rating when the Toggle group mounted. */
  defaultValue: string[];
  /** Names the Toggle group "Rating". */
  "aria-label": string;
};

/** What the comment text part hands UI SDK's Textarea: pass every key to it. */
export type FeedbackCommentTextState = {
  /** The primitive's own, so an agent's comment fills the box. */
  controller: InputController;
  /** The box's text, for a Textarea that mounts as the box opens. */
  defaultValue: string;
  /** True while a comment is being sent. */
  readOnly: boolean;
  /** Asks for what went well after a thumbs up, what could be better after a thumbs down. */
  placeholder: string;
  /** Names the box "Comment". */
  "aria-label": string;
};

type Popup = ReturnType<typeof createPopup<FeedbackOptions, FeedbackState, PopupPreset>>;

export type FeedbackApi = Popup & {
  /** The rating, `null` before there is one. */
  getRating: () => FeedbackRating;
  /** Rates the response, or clears the rating with `null`, as a press does. Returns whether the change was accepted. */
  rate: (rating: FeedbackRating) => boolean;
  /**
   * Sends `text`, which also fills the comment box, else the box's text, through `onComment`. Offered only while
   * "Add a comment" shows and no comment is being sent. Returns whether it sent anything: blank text, or a call while
   * one is pending, sends nothing and leaves the box as it was.
   */
  readonly submitComment: ((text?: string) => boolean) | undefined;
  /** Sends the box's text, as Send does. Called by the send slot. */
  send: (event?: Event) => void;
  /** Reports the rating a person pressed. Called as a Toggle's click bubbles to the thumbs part. */
  read: (event: Event) => void;
  /** Writes the rating into the Toggle group once it has attached the controller. */
  syncRating: () => void;
  /** Hands the Toggle group its props. Called by the thumbs slot. */
  thumbsState: () => FeedbackThumbsState;
  /** Hands the comment box its props. Called by the comment text slot. */
  commentTextState: (state: FeedbackState) => FeedbackCommentTextState;
  /** Takes the text a web textarea kept when the element returns to the page. Called by the comment text slot. */
  bindText: (el: HTMLElement) => void;
  /** Moves focus to the thanks, else a thumb, when "Add a comment" leaves while focused. */
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Fades in "Add a comment" or the thanks when they appear after the first frame. */
  enterSwap: (el: HTMLElement) => void;
  /** Starts counting appearances after the first frame. Called by the root slot. */
  bindRoot: () => () => void;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<FeedbackState, FeedbackApi, Props, Public>;

type FeedbackSlots = {
  root: Slot;
  thumbs: Slot<BaseSlotProps, FeedbackThumbsState>;
  comment: Slot<PopupTriggerProps & BaseSlotProps, PopupTriggerState>;
  thanks: Slot;
  content: Slot<PopupContentProps & BaseSlotProps, PopupContentState>;
  title: Slot;
  "comment-text": Slot<BaseSlotProps, FeedbackCommentTextState>;
  "comment-send": Slot<BaseSlotProps, { pending: boolean }>;
  "comment-status": Slot;
  "comment-status-icon": Slot;
  "comment-error": Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type FeedbackPrimitive = ReturnType<
  typeof definePrimitive<FeedbackOptions, FeedbackState, FeedbackApi, FeedbackSlots>
>;

const isRating = (value: unknown): value is FeedbackRating =>
  value === "up" || value === "down" || value === null;

const toRating = (value: unknown): FeedbackRating => (isRating(value) ? value : null);

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: FeedbackOptions) => ({
  label: options.label ?? "Feedback",
  canComment: options.onComment !== undefined,
  commentSent: options.commentSent ?? false,
  motion: options.motion ?? "auto",
});

const PLACEHOLDERS = {
  up: "What went well…",
  down: "What could be better…",
  none: "Add details…",
} as const;

const showsComment = (state: FeedbackState) =>
  state.rating !== null && state.canComment && !state.commentSent;

export const feedbackPrimitive: FeedbackPrimitive = definePrimitive<
  FeedbackOptions,
  FeedbackState,
  FeedbackApi,
  FeedbackSlots
>({
  name: "kind-feedback",
  options: {
    rating: "value",
    defaultRating: "value",
    onRatingChange: "callback",
    onComment: "action",
    commentSent: "boolean",
    label: "string",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    motion: "string",
  },
  state: (options) => {
    const state: FeedbackState = {
      ...popupState(options),
      ...presentation(options),
      rating: toRating(options.rating ?? options.defaultRating),
      commentText: "",
      pending: false,
      failed: false,
    };
    // The box opens only from "Add a comment", so it can't start open without it.
    return showsComment(state) ? state : { ...state, open: false, mounted: false };
  },
  sync: (options) => ({
    ...presentation(options),
    ...(options.rating === undefined ? {} : { rating: toRating(options.rating) }),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["rating"],
  api: (context) => {
    const { store } = context;
    const popup = createPopup(context, { preset: popoverPreset, trigger: "comment" });
    const change = createChange(context);
    const pending = createPendingAction(context, { state: "pending" });
    const toggles = createToggleGroupController();
    const input = createInputController();
    const initial = store.get().rating;
    let mounting = true;
    let resync = 0;
    context.onDestroy(() => {
      if (resync) cancelAnimationFrame(resync);
    });

    const syncRating = () => {
      const { rating } = store.get();
      // The controller reads `undefined` until the Toggle group attaches it.
      const shown = toggles.getValue();
      if (shown !== undefined && (shown[0] ?? null) !== rating) toggles.setValue(rating ? [rating] : []);
    };
    store.subscribe(syncRating);
    // The box goes with "Add a comment", as when an agent clears the rating.
    let commenting = showsComment(store.get());
    store.subscribe(() => {
      const state = store.get();
      const was = commenting;
      commenting = showsComment(state);
      if (was && !commenting && state.open) popup.setOpen(false);
    });

    // The controller reads `undefined` until the Textarea attaches it.
    const syncText = () => {
      const shown = input.getValue();
      const { commentText } = store.get();
      if (shown !== undefined && shown !== commentText) input.setValue(commentText);
    };
    const setText = (text: string) => {
      store.set({ commentText: text });
      syncText();
    };

    const send = (event?: Event) => {
      const { onComment } = context.options();
      const comment = store.get().commentText.trim();
      if (!onComment || !comment || !showsComment(store.get())) return false;
      const details = { source: actionSource(event, "send-press") };
      const run = pending.run(() => onComment(comment, details));
      if (!run) return false;
      store.set({ failed: false });
      void run.then((outcome) => {
        if (outcome === "failed") {
          store.set({ failed: true });
          announce("Comment not sent", { priority: "polite" });
        } else if (outcome === "done") {
          setText("");
          popup.setOpen(false);
          announce("Comment sent", { priority: "polite" });
        }
      });
      return true;
    };

    const thumbsState: FeedbackThumbsState = {
      controller: toggles,
      defaultValue: initial ? [initial] : [],
      "aria-label": "Rating",
    };
    const commentTextState = memo(
      (readOnly: boolean, defaultValue: string, rating: FeedbackRating): FeedbackCommentTextState => ({
        controller: input,
        defaultValue,
        readOnly,
        placeholder: PLACEHOLDERS[rating ?? "none"],
        "aria-label": "Comment",
      }),
    );

    return {
      ...popup,
      getRating: () => store.get().rating,
      rate: (rating) => {
        if (!isRating(rating)) return false;
        return rating === store.get().rating || change("rating", rating, { reason: "imperative" });
      },
      get submitComment() {
        const state = store.get();
        if (!showsComment(state) || state.pending) return undefined;
        return (text?: string) => {
          if (store.get().pending || (text !== undefined && !text.trim())) return false;
          if (text !== undefined) setText(text);
          return send();
        };
      },
      send: (event) => {
        send(event);
      },
      read: (event) => {
        const next = toggles.getValue()?.[0] ?? null;
        if (!isRating(next) || next === store.get().rating) return;
        // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next
        // frame: the Toggle group holds its own value.
        if (!change("rating", next, { reason: "item-press", event })) syncRating();
        else if (context.options().rating !== undefined) {
          cancelAnimationFrame(resync);
          resync = requestAnimationFrame(syncRating);
        }
      },
      syncRating,
      bindText: (el) => {
        const kept = el.querySelector("textarea")?.value;
        if (kept && kept !== store.get().commentText) store.set({ commentText: kept });
      },
      thumbsState: () => thumbsState,
      commentTextState: (state) => commentTextState(state.pending, state.commentText, state.rating),
      recovery: createFocusRecovery({
        fallback: () =>
          context.element("thanks") ??
          context.element("thumbs")?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
          context.element("thumbs")?.querySelector<HTMLElement>("button") ??
          null,
      }),
      enterSwap: (el) => {
        if (!mounting) void enter(el, "fade", { motion: store.get().motion });
      },
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        return () => cancelAnimationFrame(frame);
      },
    };
  },
  slots: (slot) => {
    const trigger = popupTrigger(slot);
    const content = popupContent(slot);
    return {
      root: slot({
        role: "group",
        attrs: (state) => ({
          "aria-label": state.label,
          "data-rating": state.rating ?? undefined,
          "data-motion": state.motion,
        }),
        bind: (_el, { api }) => api.bindRoot(),
      }),
      thumbs: slot<BaseSlotProps, FeedbackThumbsState>({
        state: (_state, { api }) => api.thumbsState(),
        // UI SDK's Toggle sets the group's value on click, before the click bubbles here.
        on: { click: (event, { api }) => api.read(event) },
        bind: (_el, { api }) => api.syncRating(),
      }),
      comment: slot({
        ...trigger,
        present: showsComment,
        attrs: (state, part) => ({ ...trigger.attrs?.(state, part), type: "button", "data-kind-button": "" }),
        bind: (el, part) => {
          const unbindTrigger = trigger.bind?.(el, part);
          const unbindRecovery = part.api.recovery.bind(el, part);
          part.api.enterSwap(el);
          return () => {
            unbindTrigger?.();
            unbindRecovery?.();
          };
        },
      }),
      // Takes the comment button's place at its height. A Tab stop, so focus has somewhere to go when it leaves.
      thanks: slot({
        focus: "tab-stop",
        present: (state) => state.commentSent,
        attrs: () => ({ tabindex: "0" }),
        bind: (el, { api }) => api.enterSwap(el),
      }),
      content: slot({
        ...content,
        attrs: (state, part) => ({ ...content.attrs?.(state, part), "data-kind-popup": "" }),
      }),
      title: popupTitle(slot),
      "comment-text": slot<BaseSlotProps, FeedbackCommentTextState>({
        state: (state, { api }) => api.commentTextState(state),
        on: {
          input: (event, { store }) =>
            store.set({ commentText: (event.target as HTMLTextAreaElement).value }),
        },
        bind: (el, { api }) => api.bindText(el),
      }),
      "comment-send": slot<BaseSlotProps, { pending: boolean }>({
        role: "button",
        focus: "native",
        press: ({ api }, event) => api.send(event),
        state: (state) => ({ pending: state.pending }),
        attrs: (state) => ({
          type: "button",
          "data-kind-button": "primary",
          "aria-disabled": state.pending || !state.commentText.trim() ? "true" : undefined,
          "data-pending": state.pending ? "" : undefined,
        }),
      }),
      // Beside Send with the error, one at a time, so neither moves anything.
      "comment-status": slot({
        present: (state) => state.pending,
      }),
      "comment-status-icon": slot({
        attrs: (state) => ({
          "aria-hidden": "true",
          "data-status-mark": "",
          "data-status": "running",
          "data-motion": state.motion,
        }),
      }),
      "comment-error": slot({
        present: (state) => state.failed && !state.pending,
      }),
    };
  },
  agent: { actions: ["rate", "submitComment"] },
});
