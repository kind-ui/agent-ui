import {
  announce,
  type ChangeDetails,
  type ChangeSource,
  createFocusRecovery,
  createInlineEdit,
  definePrimitive,
  dispatch,
  type InlineEdit,
  type InlineEditReason,
  type PrimitiveContext,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { MessageAuthor, MessageStatus, RegenerateOption, Role } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { avatarInitials } from "../avatar.js";
import { createCopy } from "../clipboard.js";
import { hearComposed } from "../composed-events.js";
import { memo } from "../memo.js";
import {
  type MenuBaseApi,
  type MenuBaseState,
  type MenuPartState,
  type MenuPresentation,
  menuBase,
  menuItems,
} from "../menu-base.js";
import { enter, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { durationLabel, timeLabel, todayKey } from "../time.js";

/** The branch switcher's text: `"2 of 3"` for the second of three. */
export const branchLabel = (index: number, count: number): string => `${index + 1} of ${count}`;

export type MessageBranchChangeReason = "previous-press" | "next-press" | "imperative";

/**
 * `"regenerate-press"`: the Regenerate button. `"item-press"`: a row of the regenerate menu. `"imperative"`: an `api`
 * call, like an agent's `regenerate`.
 */
export type MessageRegenerateReason = "regenerate-press" | "item-press" | "imperative";

/** `onRegenerate`'s details: the change details and the regenerate option chosen, if any. */
export type MessageRegenerateDetails = ChangeDetails<MessageRegenerateReason> & {
  /** The chosen option's `id`, or `undefined` for a plain regenerate or "Try again". */
  optionId: string | undefined;
};

/** `"stopped"` for an `aborted` message, `"failed"` for an `error` one. */
export type MessageOutcome = "stopped" | "failed";

/** What Retry and Continue pass their callbacks. */
export type MessageOutcomeDetails = {
  reason: "retry-press" | "continue-press" | "imperative";
  /** Who pressed it, like `"mouse"`, `"keyboard"` or `"agent"`. */
  source: ChangeSource;
};

/** The id of the regenerate menu's first row, "Try again", which regenerates with no option. */
export const MESSAGE_TRY_AGAIN = "try-again";

export type MessageOptions = {
  /**
   * Who wrote it. Not `role`, which is the element's ARIA role.
   * @default "assistant"
   */
  messageRole?: Role;
  /**
   * Where the response is. The toolbar shows once it's no longer submitted or streaming.
   * @default "complete"
   */
  status?: MessageStatus;
  /**
   * What `copy` writes and editing starts from.
   * @default ""
   */
  text?: string;
  /**
   * The response shown, from 0. Change it in `onBranchChange`.
   * @default 0
   */
  branchIndex?: number;
  /**
   * How many responses there are. The switcher shows above 1.
   * @default 1
   */
  branchCount?: number;
  /** Called with the index of the response someone asks for. Pass it back as `branchIndex` to show it. */
  onBranchChange?: (index: number, details: ChangeDetails<MessageBranchChangeReason>) => void;
  /** Called before `text` is copied. Cancel it to copy something else yourself. */
  onCopy?: (text: string, details: ChangeDetails<"copy-press" | "imperative">) => void;
  /**
   * Called to ask for a new response. Shows the regenerate action while set. `details.optionId` is the
   * `regenerateOptions` row chosen, or `undefined` for a plain regenerate or "Try again".
   */
  onRegenerate?: (text: string, details: MessageRegenerateDetails) => void;
  /**
   * Ways to regenerate, like "More concise". With any, Regenerate opens a menu whose first row is "Try again", then
   * these; one with `items` opens a submenu of them. Every `id` is unique across all levels and isn't `"try-again"`.
   * The primitive passes each `icon` through to the render layer untouched.
   */
  regenerateOptions?: RegenerateOption<unknown>[];
  /**
   * How the regenerate menu presents. `"auto"` is a bottom sheet on small touch screens and a popover elsewhere.
   * @default "auto"
   */
  presentation?: MenuPresentation;
  /** Called with the new text when someone saves an edit. Shows the edit action on user messages while set. */
  onEdit?: (text: string, details: ChangeDetails<InlineEditReason>) => void;
  /** Who wrote it. Fills the avatar part with their image or initials, and the author part with their name. */
  author?: MessageAuthor;
  /** Whether it follows its author's previous message, so it leaves out the avatar and the name. */
  continued?: boolean;
  /**
   * When it was written, as an ISO 8601 date-time. The time part reads its time of day, with the date when it isn't
   * today. Server markup shows the date; the browser reads today from its clock.
   */
  createdAt?: string;
  /** Today, as an ISO date or instant, in place of the browser's clock. */
  now?: string;
  /** How long the response took, in seconds: "4 sec", "1 min 12 sec". */
  durationSeconds?: number;
  /**
   * The language dates and durations read in, a BCP 47 tag.
   * @default "en"
   */
  locale?: string;
  /**
   * The IANA time zone times read in, like `"Europe/Paris"`.
   * @default "UTC"
   */
  timeZone?: string;
  /**
   * What went wrong, shown while the status is `error`.
   * @default "Something went wrong"
   */
  error?: string;
  /**
   * Called to try a failed response again. Shows Retry while set and the status is `error`. Return a promise to keep
   * it pending until it settles: a rejection makes it available again.
   */
  onRetry?: (details: MessageOutcomeDetails) => unknown;
  /**
   * Called to continue a stopped response. Shows Continue while set and the status is `aborted`. Return a promise to
   * keep it pending until it settles.
   */
  onContinue?: (details: MessageOutcomeDetails) => unknown;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type MessageState = MenuBaseState & {
  /** The `messageRole` option. */
  role: Role;
  status: MessageStatus;
  branchIndex: number;
  branchCount: number;
  /** Whether `onRegenerate` is set. */
  canRegenerate: boolean;
  /** The host's `regenerateOptions` as passed, icons included. */
  regenerateOptions: RegenerateOption<unknown>[];
  /** Whether it's a user message with `onEdit`. */
  canEdit: boolean;
  motion: MotionMode;
  /** The `author` option. */
  author: MessageAuthor | undefined;
  continued: boolean;
  createdAt: string | undefined;
  durationSeconds: number | undefined;
  locale: string | undefined;
  timeZone: string | undefined;
  /** Today: the `now` option, else the browser's clock once bound, else `undefined`, as on a server. */
  now: string | undefined;
  /** `"stopped"` or `"failed"` once the response stopped or failed, else `null`. */
  outcome: MessageOutcome | null;
  /** The `error` option's words, or the default. */
  errorText: string;
  canRetry: boolean;
  canContinue: boolean;
  /** Whether a promise `onRetry` or `onContinue` returned is still pending. */
  outcomePending: boolean;
  /** `"message"` while the text is being edited, else `null`. */
  editing: string | null;
  copied: boolean;
};

export type MessageApi = {
  /** Copies `text` and resolves with whether it worked. */
  copy: (event?: Event) => Promise<boolean>;
  /**
   * Calls `onRegenerate`, with a `regenerateOptions` id or none. Offered once the message settles, while
   * `onRegenerate` is set. Returns whether it ran: `false` for an unknown id, or one the owner cancelled.
   */
  readonly regenerate: ((optionId?: string, event?: Event) => boolean) | undefined;
  /** Starts editing in place. Offered once a user message with `onEdit` settles. */
  readonly edit: ((event?: Event) => void) | undefined;
  /** Asks `onBranchChange` for the response at an index, from 0. Offered when there's more than one. */
  readonly setBranch: ((index: number, event?: Event) => void) | undefined;
  inlineEdit: InlineEdit;
  /** Calls `onRetry`. Offered while it's set, the message failed and nothing is pending. */
  readonly retry: ((event?: Event) => void) | undefined;
  /** Calls `onContinue`. Offered while it's set, the message stopped and nothing is pending. */
  readonly continue: ((event?: Event) => void) | undefined;
  /**
   * Plays the toolbar's or the outcome's entrance when the message settles while mounted, not when it mounts
   * settled.
   */
  enterToolbar: (el: HTMLElement) => void;
  /** Reads today from the browser's clock, unless `now` is set. Called by the time part's `bind`. */
  readClock: () => void;
  /** Moves focus out of the outcome when Retry or Continue leaves while focused. */
  outcomeRecovery: ReturnType<typeof createFocusRecovery>;
  /** The avatar and time parts' states, memoized. */
  avatarState: (state: MessageState) => MessageAvatarState;
  timeState: (state: MessageState) => MessageTimeState;
  /** The regenerate menu, built on `menuBase`. */
  regenerateMenu: MenuBaseApi;
  /** The regenerate and regenerate-content slots' states, memoized. */
  regenerateState: (state: MessageState) => MessageRegenerateState;
  regenerateContentState: (state: MessageState) => MessageRegenerateContentState;
};

/** What the avatar slot hands render functions: the `author`'s, or empty strings without one. */
export type MessageAvatarState = { name: string; initials: string; src: string | undefined };

/** What the time slot hands render functions: its words and its `datetime`. */
export type MessageTimeState = { label: string; dateTime: string };

/** What the regenerate slot hands render functions: UI SDK Menu's props while there are `regenerateOptions`. */
export type MessageRegenerateState = { menu: MenuPartState | undefined };

/** What the regenerate-content slot hands render functions: "Try again", then the host's options. */
export type MessageRegenerateContentState = {
  tryAgain: RegenerateOption<unknown>;
  options: RegenerateOption<unknown>[];
};

type MessageSlot<Public extends object = Record<never, never>> = SlotDefinition<
  MessageState,
  MessageApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type MessagePrimitive = ReturnType<
  typeof definePrimitive<
    MessageOptions,
    MessageState,
    MessageApi,
    Record<
      | "root"
      | "header"
      | "content"
      | "editor"
      | "toolbar"
      | "copy"
      | "regenerate-trigger"
      | "edit"
      | "branch"
      | "branch-previous"
      | "branch-next"
      | "outcome"
      | "outcome-icon"
      | "retry"
      | "continue",
      MessageSlot
    > & {
      avatar: MessageSlot<MessageAvatarState>;
      author: MessageSlot<{ name: string }>;
      time: MessageSlot<MessageTimeState>;
      duration: MessageSlot<{ label: string }>;
      "outcome-text": MessageSlot<{ text: string }>;
      "branch-label": MessageSlot<{ label: string }>;
      regenerate: MessageSlot<MessageRegenerateState>;
      "regenerate-content": MessageSlot<MessageRegenerateContentState>;
    }
  >
>;

const EDITING = "message";

const settled = (status: MessageStatus) => status !== "submitted" && status !== "streaming";

const OUTCOMES: Partial<Record<MessageStatus, MessageOutcome>> = { aborted: "stopped", error: "failed" };
const ANNOUNCEMENTS: Record<MessageOutcome, string> = {
  stopped: "Response stopped",
  failed: "Response failed",
};
/** The outcome's words: "Stopped", or the `error` option's words. Empty while there's no outcome. */
export const messageOutcomeText = (state: Pick<MessageState, "outcome" | "errorText">): string =>
  state.outcome === "stopped" ? "Stopped" : state.outcome === "failed" ? state.errorText : "";
const NO_AVATAR: MessageAvatarState = { name: "", initials: "", src: undefined };

const hasHeader = (state: MessageState) =>
  (state.author !== undefined && !state.continued) ||
  (state.createdAt !== undefined && timeLabel(state.createdAt) !== "") ||
  durationLabel(state.durationSeconds) !== "";

const TRY_AGAIN: RegenerateOption<unknown> = { id: MESSAGE_TRY_AGAIN, label: "Try again" };
const NO_OPTIONS: RegenerateOption<unknown>[] = [];
const NO_DATA: MenuData = [];

const entry = (option: RegenerateOption<unknown>): MenuData[number] =>
  option.items
    ? { type: "submenu", label: option.label, items: option.items.map(entry) }
    : { value: option.id, label: option.label };

// Built once per `regenerateOptions` array, since `menuBase` asks for one array per input.
const built = new WeakMap<RegenerateOption<unknown>[], MenuData>();
const toData = (options: RegenerateOption<unknown>[] | undefined): MenuData => {
  if (!options?.length) return NO_DATA;
  let data = built.get(options);
  if (!data) {
    data = [entry(TRY_AGAIN), { type: "separator" }, ...options.map(entry)];
    built.set(options, data);
  }
  return data;
};

type Context = PrimitiveContext<MessageOptions, MessageState, string>;

const runRegenerate = (
  context: Context,
  optionId: string | undefined,
  details: { reason: MessageRegenerateReason; event?: Event | undefined; source?: ChangeSource },
) => {
  const { canRegenerate, status, items } = context.store.get();
  if (!canRegenerate || !settled(status)) return false;
  const chosen = optionId === MESSAGE_TRY_AGAIN ? undefined : optionId;
  if (chosen !== undefined && !menuItems(items).some((item) => item.value === chosen)) return false;
  const { event, ...rest } = details;
  return !dispatch(context, "onRegenerate", context.options().text ?? "", {
    ...rest,
    ...(event && { event }),
    optionId: chosen,
  });
};

const menu = menuBase<MessageOptions>({
  kind: "message-regenerate",
  label: "Regenerate",
  toData: (options) => toData(options.regenerateOptions),
  // Web markup keeps its menu without options, when the trigger regenerates instead.
  canOpen: (options) =>
    !!options.regenerateOptions?.length &&
    options.onRegenerate !== undefined &&
    settled(options.status ?? "complete"),
  onAction: (value, { event, source, keepOpen }, context) => {
    // `menuBase` types the context with its own state; it's Message's.
    if (!runRegenerate(context as Context, value, { reason: "item-press", event, source })) keepOpen();
  },
});

const presentation = (options: MessageOptions) => {
  const role = options.messageRole ?? "assistant";
  const status = options.status ?? "complete";
  return {
    author: options.author?.name ? options.author : undefined,
    continued: options.continued ?? false,
    createdAt: options.createdAt || undefined,
    durationSeconds: options.durationSeconds,
    locale: options.locale || undefined,
    timeZone: options.timeZone || undefined,
    // A web `status` attribute can hold any string.
    outcome: OUTCOMES[status] ?? null,
    errorText: options.error || "Something went wrong",
    canRetry: options.onRetry !== undefined,
    canContinue: options.onContinue !== undefined,
    role,
    status: options.status ?? "complete",
    branchIndex: options.branchIndex ?? 0,
    branchCount: options.branchCount ?? 1,
    canRegenerate: options.onRegenerate !== undefined,
    regenerateOptions: options.regenerateOptions ?? NO_OPTIONS,
    canEdit: role === "user" && options.onEdit !== undefined,
    motion: options.motion ?? "auto",
  };
};

export const messagePrimitive: MessagePrimitive = definePrimitive({
  name: "kind-message",
  options: {
    messageRole: "string",
    status: "string",
    text: "string",
    branchIndex: "number",
    branchCount: "number",
    onBranchChange: "callback",
    onCopy: "callback",
    onRegenerate: "callback",
    regenerateOptions: "value",
    presentation: "string",
    onEdit: "callback",
    author: "value",
    continued: "boolean",
    createdAt: "string",
    now: "string",
    durationSeconds: "number",
    locale: "string",
    timeZone: "string",
    error: "string",
    onRetry: "action",
    onContinue: "action",
    motion: "string",
  },
  state: (options: MessageOptions): MessageState => ({
    ...menu.state(options),
    ...presentation(options),
    now: options.now || undefined,
    outcomePending: false,
    editing: null,
    copied: false,
  }),
  sync: (options) => ({ ...menu.sync(options), ...presentation(options) }),
  controlled: ["branchIndex", "branchCount", "status", "outcome"],
  api: (context): MessageApi => {
    const { store } = context;
    const regenerateMenu = menu.api(context);
    const regenerateState = memo(
      (part: MenuPartState, shown: boolean): MessageRegenerateState => ({ menu: shown ? part : undefined }),
    );
    const regenerateContentState = memo(
      (options: RegenerateOption<unknown>[]): MessageRegenerateContentState => ({
        tryAgain: TRY_AGAIN,
        options,
      }),
    );
    const copy = createCopy(context);
    const text = () => context.options().text ?? "";
    let streamed = !settled(store.get().status);
    let clock = false;
    const today = (options: MessageOptions) =>
      options.now || (clock ? todayKey(options.timeZone || undefined) : undefined);
    const pendingOutcome = createPendingAction(context, { state: "outcomePending" });
    let status = store.get().status;
    context.onOptions((options) => {
      const next = options.status ?? "complete";
      if (!settled(next)) streamed = true;
      const now = today(options);
      if (now !== store.get().now) store.set({ now });
      if (next === status) return;
      status = next;
      // A new status answers a pending Retry or Continue.
      pendingOutcome.release();
      const outcome = OUTCOMES[next];
      // Only for a response this instance saw being written, so a page of earlier messages is quiet.
      if (outcome && streamed) announce(ANNOUNCEMENTS[outcome], { priority: "polite" });
    });
    const runOutcome = (
      name: "onRetry" | "onContinue",
      press: "retry-press" | "continue-press",
      event?: Event,
    ) => {
      const call = context.options()[name];
      if (!call) return;
      const reason = event ? press : "imperative";
      void pendingOutcome.run(() => call({ reason, source: actionSource(event, reason) }));
    };
    const avatarState = memo(
      (author: MessageAuthor): MessageAvatarState => ({
        name: author.name,
        initials: avatarInitials(author.name),
        src: author.avatarUrl || undefined,
      }),
    );
    const timeState = memo(
      (createdAt: string, locale?: string, timeZone?: string, now?: string): MessageTimeState => ({
        label: timeLabel(createdAt, { locale, timeZone, now }),
        dateTime: createdAt,
      }),
    );

    const inlineEdit = createInlineEdit(context, {
      key: "editing",
      value: text,
      commit: (_id, value, details) => !dispatch(context, "onEdit", value, details),
    });

    const setBranch = (index: number, event?: Event) => {
      const { branchIndex, branchCount } = store.get();
      if (!Number.isInteger(index) || index < 0 || index >= branchCount || index === branchIndex) return;
      const reason = !event ? "imperative" : index < branchIndex ? "previous-press" : "next-press";
      dispatch(context, "onBranchChange", index, event ? { reason, event } : { reason });
    };

    return {
      copy: async (event?: Event) => {
        const value = text();
        if (
          dispatch(
            context,
            "onCopy",
            value,
            event ? { reason: "copy-press", event } : { reason: "imperative" },
          )
        )
          return false;
        return copy(value);
      },
      get regenerate() {
        const { canRegenerate, status } = store.get();
        if (!canRegenerate || !settled(status)) return undefined;
        return (optionId?: string, event?: Event) => {
          if (!runRegenerate(context, optionId, { reason: event ? "regenerate-press" : "imperative", event }))
            return false;
          // A row closes the menu itself; an agent's call closes it as the row would.
          regenerateMenu.setOpen(false);
          return true;
        };
      },
      get edit() {
        const { canEdit, status } = store.get();
        if (!canEdit || !settled(status)) return undefined;
        return (event?: Event) =>
          void inlineEdit.start(EDITING, event ? { reason: "imperative", event } : undefined);
      },
      get setBranch() {
        return store.get().branchCount > 1 ? setBranch : undefined;
      },
      get retry() {
        const { canRetry, outcome, outcomePending } = store.get();
        return canRetry && outcome === "failed" && !outcomePending
          ? (event?: Event) => runOutcome("onRetry", "retry-press", event)
          : undefined;
      },
      get continue() {
        const { canContinue, outcome, outcomePending } = store.get();
        return canContinue && outcome === "stopped" && !outcomePending
          ? (event?: Event) => runOutcome("onContinue", "continue-press", event)
          : undefined;
      },
      readClock: () => {
        clock = true;
        const now = today(context.options());
        if (now !== store.get().now) store.set({ now });
      },
      // The toolbar takes focus when it's there; Retry and Continue leave as a new response starts.
      outcomeRecovery: createFocusRecovery({
        fallback: () =>
          context.element("toolbar")?.querySelector<HTMLElement>("button:not([disabled])") ?? null,
      }),
      avatarState: (state) => (state.author ? avatarState(state.author) : NO_AVATAR),
      timeState: (state) => timeState(state.createdAt ?? "", state.locale, state.timeZone, state.now),
      inlineEdit,
      enterToolbar: (el) => {
        if (streamed) void enter(el, "fade", { motion: store.get().motion });
      },
      regenerateMenu,
      regenerateState: (state) =>
        regenerateState(regenerateMenu.partState.menu(state), state.items.length > 0),
      regenerateContentState: (state) => regenerateContentState(state.regenerateOptions),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "article",
      attrs: (state) => ({
        "data-role": state.role,
        "data-status": state.status,
        "data-editing": state.editing === null ? undefined : "",
        "data-continued": state.continued ? "" : undefined,
        "aria-busy": state.outcomePending ? "true" : undefined,
      }),
    }),
    avatar: slot<BaseSlotProps, MessageAvatarState>({
      state: (state, { api }) => api.avatarState(state),
      // With an `author`, the name beside it says who wrote it.
      attrs: (state) => ({
        "data-role": state.role,
        "data-continued": state.continued ? "" : undefined,
        "aria-hidden": state.author ? "true" : undefined,
        "data-author": state.author ? "" : undefined,
      }),
    }),
    header: slot({
      present: hasHeader,
      attrs: (state) => ({ "data-role": state.role }),
    }),
    author: slot<BaseSlotProps, { name: string }>({
      present: (state) => state.author !== undefined && !state.continued,
      state: (state) => ({ name: state.author?.name ?? "" }),
    }),
    time: slot<BaseSlotProps, MessageTimeState>({
      present: (state) => state.createdAt !== undefined && timeLabel(state.createdAt) !== "",
      state: (state, { api }) => api.timeState(state),
      attrs: (state) => ({ datetime: state.createdAt }),
      bind: (_el, { api }) => api.readClock(),
    }),
    duration: slot<BaseSlotProps, { label: string }>({
      present: (state) => durationLabel(state.durationSeconds) !== "",
      state: (state) => ({ label: durationLabel(state.durationSeconds, state.locale) }),
    }),
    content: slot({
      present: (state) => state.editing === null,
      attrs: (state) => ({ "data-role": state.role, "data-status": state.status }),
    }),
    editor: slot({
      present: (state) => state.editing !== null,
      attrs: () => ({ "aria-label": "Edit message" }),
      on: {
        keydown: (event, { api }) => api.inlineEdit.inputKeydown(event as KeyboardEvent),
        focusout: (event, { api }) => api.inlineEdit.end("focus-out", event),
      },
      bind: (el, { api }) => api.inlineEdit.bindInput(el as HTMLTextAreaElement),
    }),
    outcome: slot({
      present: (state) => state.outcome !== null,
      attrs: (state) => ({ "data-outcome": state.outcome ?? undefined, "data-motion": state.motion }),
      bind: (el, { api }) => api.enterToolbar(el),
    }),
    "outcome-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": state.outcome === "failed" ? "error" : "cancelled",
        "data-motion": state.motion,
      }),
    }),
    "outcome-text": slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: messageOutcomeText(state) }),
    }),
    retry: slot({
      role: "button",
      focus: "native",
      present: (state) => state.canRetry && state.outcome === "failed",
      press: ({ api }, event) => api.retry?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.outcomePending ? "true" : undefined,
        "data-pending": state.outcomePending ? "" : undefined,
      }),
      bind: (el, part) => part.api.outcomeRecovery.bind(el, part),
    }),
    continue: slot({
      role: "button",
      focus: "native",
      present: (state) => state.canContinue && state.outcome === "stopped",
      press: ({ api }, event) => api.continue?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.outcomePending ? "true" : undefined,
        "data-pending": state.outcomePending ? "" : undefined,
      }),
      bind: (el, part) => part.api.outcomeRecovery.bind(el, part),
    }),
    toolbar: slot({
      present: (state) => settled(state.status),
      attrs: (state) => ({ "data-role": state.role }),
      bind: (el, { api }) => api.enterToolbar(el),
    }),
    // The actions wrap UI SDK toolbar buttons and hear their clicks bubble up (spec §2, composing UI SDK).
    copy: slot({
      attrs: (state) => ({ "data-copied": state.copied ? "" : undefined }),
      on: { click: (event, { api }) => void api.copy(event) },
    }),
    // With options it holds UI SDK Menu, whose choices reach `menuBase` (web: through `hearComposed`); its trigger's
    // and rows' clicks bubble here too, and aren't a plain regenerate.
    regenerate: slot<BaseSlotProps, MessageRegenerateState>({
      present: (state) => state.canRegenerate,
      state: (state, { api }) => api.regenerateState(state),
      attrs: (state) => ({
        "data-kind": "message-regenerate",
        "data-menu-part": "root",
        "data-open": state.open ? "" : undefined,
        "data-motion": state.motion,
      }),
      on: {
        click: (event, { api, store }) => {
          if (!store.get().items.length) api.regenerate?.(undefined, event);
        },
      },
      bind: (el, { api }) => hearComposed(el, api.regenerateMenu.composedEvents),
    }),
    "regenerate-trigger": slot({
      attrs: (state) => ({ "data-menu-part": "trigger", "data-open": state.open ? "" : undefined }),
    }),
    "regenerate-content": slot<BaseSlotProps, MessageRegenerateContentState>({
      state: (state, { api }) => api.regenerateContentState(state),
      attrs: (state) => ({ "data-menu-part": "content", "data-motion": state.motion }),
    }),
    edit: slot({
      present: (state) => state.canEdit,
      on: { click: (event, { api }) => api.edit?.(event) },
    }),
    branch: slot({
      role: "group",
      present: (state) => state.branchCount > 1,
      attrs: () => ({ "aria-label": "Responses" }),
    }),
    "branch-previous": slot({
      role: "button",
      focus: "native",
      press: ({ api, store }, event) => api.setBranch?.(store.get().branchIndex - 1, event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Previous response",
        "aria-disabled": state.branchIndex <= 0 ? "true" : undefined,
      }),
    }),
    // Web has no render function to show `label`, so `bind` writes it; React renders the same text first.
    "branch-label": slot<BaseSlotProps, { label: string }>({
      state: (state) => ({ label: branchLabel(state.branchIndex, state.branchCount) }),
      bind: (el, { store }) => {
        const write = () => {
          const { branchIndex, branchCount } = store.get();
          const label = branchLabel(branchIndex, branchCount);
          if (el.textContent !== label) el.textContent = label;
        };
        write();
        return store.subscribe(write);
      },
    }),
    "branch-next": slot({
      role: "button",
      focus: "native",
      press: ({ api, store }, event) => api.setBranch?.(store.get().branchIndex + 1, event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Next response",
        "aria-disabled": state.branchIndex >= state.branchCount - 1 ? "true" : undefined,
      }),
    }),
  }),
  agent: {
    actions: ["copy", "regenerate", "edit", "setBranch", "retry", "continue"],
    items: (api) =>
      menuItems(api.regenerateMenu.getItems()).filter((item) => item.value !== MESSAGE_TRY_AGAIN),
    closed: true,
  },
});
