import {
  announce,
  createFocusRecovery,
  type PrimitiveContext,
  prepareAnnouncements,
  type SlotFactory,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { bindLeavingRow } from "../leaving.js";
import { enter, type MotionMode } from "../motion/index.js";

export type NoticeVariant = "info" | "success" | "warning" | "error";

export type NoticeOptions = {
  /**
   * How the notice reads: its icon and colors.
   * @default "info"
   */
  variant?: NoticeVariant;
  /**
   * The notice's title, which names it. Announced when the notice is added after the page loads, or when its
   * variant changes.
   */
  label?: string;
  /**
   * Called once Dismiss has faded the notice out: remove the notice then. Shows Dismiss while set. Return a promise
   * to wait for it: a rejection brings the notice back.
   */
  onDismiss?: () => unknown;
  /**
   * Where focus goes when Dismiss is pressed. Defaults to the next element Tab reaches after the notice, else the
   * last one before it.
   */
  focusFallback?: () => HTMLElement | null | undefined;
  /**
   * How the notice comes in and leaves: at full motion it rises in and fades out; reduced motion only fades.
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type NoticeState = {
  /** The `variant`, else the component's default. */
  variant: NoticeVariant;
  /** The title, or empty. */
  label: string;
  /** Whether `onDismiss` is set. */
  canDismiss: boolean;
  /** True from Dismiss until the host removes the notice, or `onDismiss` rejects. */
  dismissing: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

export type NoticeApi = {
  /** Moves focus out of the notice, fades it out, then calls `onDismiss`, as Dismiss does. Offered while `onDismiss` is set. */
  readonly dismiss: (() => void) | undefined;
  /** Plays the entrance and the announcement of a notice added after the page loaded, and the exit. Called by the root slot. */
  bindRoot: (el: HTMLElement, part: { key: string; props: unknown }) => () => void;
};

export type NoticeBaseConfig<Options extends NoticeOptions> = {
  /** The variant when the host passes none. Else `"info"`. */
  variant?: NoticeVariant;
  /** The title when the host passes no `label`. Else none. */
  label?: (options: Options) => string;
  /** Whether the announcement interrupts what a screen reader is saying. Else it waits. */
  urgent?: (options: Options) => boolean;
};

const VARIANTS: Record<NoticeVariant, { mark: string; name: string }> = {
  info: { mark: "info", name: "Info" },
  success: { mark: "complete", name: "Success" },
  warning: { mark: "warning", name: "Warning" },
  error: { mark: "error", name: "Error" },
};

/**
 * The first element after `el` that Tab reaches, else the last one before it. UI SDK finds these with a function it
 * doesn't export, and `createFocusRecovery` asks its `fallback` for the element.
 */
const nearestTabStop = (el: HTMLElement): HTMLElement | undefined => {
  const stops = [...el.ownerDocument.body.querySelectorAll<HTMLElement>("*")].filter(
    (candidate) =>
      candidate.tabIndex >= 0 &&
      !el.contains(candidate) &&
      !candidate.matches(":disabled") &&
      !candidate.closest("[inert]") &&
      candidate.checkVisibility({ visibilityProperty: true }),
  );
  const isAfter = (candidate: HTMLElement) =>
    Boolean(el.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING);
  return stops.find(isAfter) ?? stops.filter((candidate) => !isAfter(candidate)).at(-1);
};

/**
 * Whether the page is still loading: it hasn't finished, or hasn't painted any content yet, as when an app renders
 * its first view after the load event. Browsers without paint timing go by `readyState` alone.
 */
const pageLoading = (doc: Document) =>
  doc.readyState !== "complete" ||
  (PerformanceObserver.supportedEntryTypes.includes("paint") &&
    performance.getEntriesByName("first-contentful-paint").length === 0);

/**
 * Everything but the name of Notice and Guardrail Notice (spec §7, D10): a titled note with a status mark, the
 * host's description and actions, and Dismiss. Each spreads it into its own `definePrimitive`, wrapping `state`,
 * `api` and `slots` to add its own, as the Step-based components spread `stepBase`. Slots write `data-notice-part`.
 */
export const noticeBase = <
  State extends NoticeState = NoticeState,
  Api extends NoticeApi = NoticeApi,
  Options extends NoticeOptions = NoticeOptions,
>({
  variant: defaultVariant = "info",
  label: defaultLabel = () => "",
  urgent = () => false,
}: NoticeBaseConfig<Options> = {}) => {
  const variantOf = (options: Options): NoticeVariant =>
    // Web attributes are untyped: an unknown variant reads as the default.
    options.variant && Object.hasOwn(VARIANTS, options.variant) ? options.variant : defaultVariant;
  const labelOf = (options: Options) => options.label ?? defaultLabel(options);
  const presentation = (options: Options) => ({
    variant: variantOf(options),
    label: labelOf(options),
    canDismiss: options.onDismiss !== undefined,
    motion: options.motion ?? "auto",
  });
  return {
    options: {
      variant: "string",
      label: "string",
      onDismiss: "action",
      focusFallback: "value",
      motion: "string",
    } as const,
    state: (options: Options): NoticeState => ({ ...presentation(options), dismissing: false }),
    // Typed on `State`, so a component's own `sync` can spread it.
    sync: (options: Options) => presentation(options) as Partial<State>,
    api: (context: PrimitiveContext<Options, NoticeState, string>): NoticeApi => {
      const { store } = context;
      // A variant set before the notice's first frame isn't news.
      let shown = false;
      let variant = store.get().variant;
      const announceLabel = (options: Options) => {
        const text = labelOf(options);
        if (text) announce(text, { priority: urgent(options) ? "assertive" : "polite" });
      };

      context.onOptions((options) => {
        const next = variantOf(options);
        if (next === variant) return;
        variant = next;
        if (shown) announceLabel(options);
      });

      const recovery = createFocusRecovery({
        fallback: (lost) =>
          context.options().focusFallback?.() ?? (lost.el.isConnected ? nearestTabStop(lost.el) : undefined),
      });
      const dismiss = () => store.set({ dismissing: true });

      return {
        get dismiss() {
          const state = store.get();
          return state.canDismiss && !state.dismissing ? dismiss : undefined;
        },
        bindRoot: (el, part) => {
          prepareAnnouncements(el.ownerDocument);
          // A notice on the page as it loads is read with the page; one added later comes in and is announced.
          const added = !pageLoading(el.ownerDocument);
          if (added) void enter(el, "fade-up", { motion: store.get().motion });
          // A frame later, since web hosts can only set the label once the element exists.
          const frame = requestAnimationFrame(() => {
            shown = true;
            if (added) announceLabel(context.options());
          });
          const unbind = bindLeavingRow(el, {
            store,
            isLeaving: () => store.get().dismissing,
            motion: () => ({ motion: store.get().motion }),
            join: () => recovery.bind(el, part),
            drop: () =>
              void new Promise((resolve) => resolve(context.options().onDismiss?.())).catch(() =>
                store.set({ dismissing: false }),
              ),
          });
          return () => {
            cancelAnimationFrame(frame);
            unbind();
          };
        },
      };
    },
    slots: (slot: SlotFactory<State, Api>) => ({
      root: slot({
        role: "note",
        attrs: (state, part) => ({
          "aria-labelledby": state.label ? `${part.id}-title` : undefined,
          "data-notice-part": "root",
          "data-variant": state.variant,
          "data-motion": state.motion,
        }),
        bind: (el, part) => part.api.bindRoot(el, part),
      }),
      // Named, so the variant has words and not only a color and a glyph.
      icon: slot({
        role: "img",
        attrs: (state) => ({
          "aria-label": VARIANTS[state.variant].name,
          "data-notice-part": "icon",
          "data-status-mark": "",
          "data-status": VARIANTS[state.variant].mark,
          "data-motion": state.motion,
        }),
      }),
      title: slot<BaseSlotProps, { label: string }>({
        present: (state) => state.label !== "",
        state: (state) => ({ label: state.label }),
        attrs: (_state, part) => ({ id: `${part.id}-title`, "data-notice-part": "title" }),
      }),
      description: slot({ attrs: () => ({ "data-notice-part": "description" }) }),
      actions: slot({ attrs: () => ({ "data-notice-part": "actions" }) }),
      dismiss: slot({
        role: "button",
        focus: "native",
        present: (state) => state.canDismiss,
        press: ({ api }) => api.dismiss?.(),
        attrs: () => ({ type: "button", "aria-label": "Dismiss", "data-notice-part": "dismiss" }),
      }),
    }),
    agent: { actions: ["dismiss"] },
  };
};
