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
  keepFocus,
  type PrimitiveContext,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { MenuData } from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { MessageAuthor, MessageStatus, RegenerateOption, RetryState, Role } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { avatarInitials } from "../avatar.js";
import { createCopy } from "../clipboard.js";
import { hearComposed } from "../composed-events.js";
import { createCountdown } from "../countdown.js";
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
import { failedAfterText, retryAnnouncement, retryReason, retryText } from "../retry.js";
import { nearestTabStop } from "../tab-stop.js";
import { insertTextNearby } from "../text-target.js";
import { durationLabel, timeLabel, todayKey } from "../time.js";
import { everyMinute } from "../today.js";
import { WORDS } from "../words.js";

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

/** Where a user message is on its way to the agent. Absent once delivered. */
export type MessageDelivery = "queued" | "steering" | "not-sent";

/** What Withdraw, Retry on "Not sent", Retry now and Cancel pass their callbacks. */
export type MessageDeliveryDetails = {
  reason: "withdraw-press" | "resend-press" | "retry-now-press" | "cancel-retry-press" | "imperative";
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
  /**
   * Whether it follows its author's previous message, so it leaves out the avatar and the name.
   * @default false
   */
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
   * A user message that isn't with the agent yet: `"queued"` waits on the server (the bubble turns muted and dashed),
   * `"steering"` was sent into the running turn and not yet read, `"not-sent"` failed to send. The footer says so,
   * and is the message's accessible description. Leave it out once delivered.
   */
  delivery?: MessageDelivery;
  /**
   * Called to take back a queued or steering message. Shows Withdraw while set. Once the call resolves, the text goes
   * back to the nearest Composer and you remove the message; until `delivery` changes, Withdraw stays locked.
   */
  onWithdraw?: (details: MessageDeliveryDetails) => unknown;
  /** Called to send a message again after `"not-sent"`. Shows Retry beside "Not sent" while set. */
  onResend?: (details: MessageDeliveryDetails) => unknown;
  /**
   * The request is being retried: "Rate limited. Retrying in 4 sec, attempt 2 of 5" shows after the content, counting
   * down `retryAfter` from when you pass it. Keep the status `submitted` or `streaming`; set it to `error` with `retry`
   * still set when the attempts run out, and the outcome reads "Failed after 5 attempts".
   */
  retry?: RetryState;
  /** Called to try again without waiting. Shows Retry now while retrying; locked until `retry.attempt` changes. */
  onRetryNow?: (details: MessageDeliveryDetails) => unknown;
  /** Called to stop retrying. Shows Cancel while retrying. */
  onCancelRetry?: (details: MessageDeliveryDetails) => unknown;
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
  /** The `author` option, while it has a `name`. */
  author: MessageAuthor | undefined;
  /** The `continued` option. */
  continued: boolean;
  /** The `createdAt` option, or `undefined` while empty. */
  createdAt: string | undefined;
  /** The `durationSeconds` option, in seconds. */
  durationSeconds: number | undefined;
  /** The `locale` option, or `undefined` for English. */
  locale: string | undefined;
  /** The `timeZone` option, or `undefined` for UTC. */
  timeZone: string | undefined;
  /** Today: the `now` option, else the browser's clock once bound, else `undefined`, as on a server. */
  now: string | undefined;
  /** `"stopped"` or `"failed"` once the response stopped or failed, else `null`. */
  outcome: MessageOutcome | null;
  /** The `error` option's words, or the default. */
  errorText: string;
  /** Whether `onRetry` is set. Retry shows while this is true and `outcome` is `"failed"`. */
  canRetry: boolean;
  /** Whether `onContinue` is set. Continue shows while this is true and `outcome` is `"stopped"`. */
  canContinue: boolean;
  /** Whether a promise `onRetry` or `onContinue` returned is still pending. */
  outcomePending: boolean;
  /** The `delivery` option, on a user message. */
  delivery: MessageDelivery | undefined;
  /** Whether `onWithdraw` is set. */
  canWithdraw: boolean;
  /** Whether `onResend` is set. */
  canResend: boolean;
  /** Whether a withdraw or resend is pending, or resolved and waiting for `delivery` to change. */
  deliveryPending: boolean;
  /** `retry.attempt`, or `null` while not retrying. */
  retryAttempt: number | null;
  /** `retry.maxAttempts`. */
  retryMaxAttempts: number | undefined;
  /** `retry.retryAfter`. */
  retryAfter: number | undefined;
  /** `retry.reason`. */
  retryReason: string | undefined;
  /** Whole seconds until the next attempt, once the root binds; `null` while nothing counts. Live. */
  retrySeconds: number | null;
  /** Whether `onRetryNow` is set. */
  canRetryNow: boolean;
  /** Whether `onCancelRetry` is set. */
  canCancelRetry: boolean;
  /** Whether Retry now or Cancel is pending, or resolved and waiting for the attempt to change. */
  retryPending: boolean;
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
   * Calls `onWithdraw`, then gives the text back to the nearest Composer. Offered while it's set, the message is
   * queued or steering, and nothing is pending.
   */
  readonly withdraw: ((event?: Event) => void) | undefined;
  /** Calls `onResend`. Offered while it's set, the message wasn't sent and nothing is pending. */
  readonly resend: ((event?: Event) => void) | undefined;
  /** Calls `onRetryNow`. Offered while it's set, the request is retrying and nothing is pending. */
  readonly retryNow: ((event?: Event) => void) | undefined;
  /** Calls `onCancelRetry`. Offered while it's set, the request is retrying and nothing is pending. */
  readonly cancelRetry: ((event?: Event) => void) | undefined;
  /** Counts down `retry.retryAfter`, and starts announcing a frame after it binds. Bound by the root. */
  bindRoot: () => () => void;
  /** Moves focus past the message when Withdraw or Retry leaves while focused. */
  deliveryRecovery: ReturnType<typeof createFocusRecovery>;
  /** Moves focus to Retry, the toolbar or past the message when Retry now or Cancel leaves while focused. */
  retryRecovery: ReturnType<typeof createFocusRecovery>;
  /**
   * Plays the toolbar's or the outcome's entrance when the message settles while mounted, not when it mounts
   * settled.
   */
  enterToolbar: (el: HTMLElement) => void;
  /**
   * Reads today from the browser's clock, unless `now` is set, and again each minute until the returned function is
   * called. Called by the time part's `bind`.
   */
  readClock: () => () => void;
  /** Moves focus out of the outcome when Retry or Continue leaves while focused. */
  outcomeRecovery: ReturnType<typeof createFocusRecovery>;
  /** Handles a key in the editor: Enter saves, Escape cancels, and either puts focus back on Edit. */
  editKeydown: (event: KeyboardEvent) => void;
  /** Saves the edit, as Enter does. */
  saveEdit: (event?: Event) => void;
  /** Ends the edit without saving, as Escape does. */
  cancelEdit: () => void;
  /** Saves the edit when focus leaves the editor and its buttons, as it leaves an editor without them. */
  editFocusOut: (event: FocusEvent) => void;
  /** Moves focus to Edit when Cancel or Save leaves while focused. */
  editRecovery: ReturnType<typeof createFocusRecovery>;
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
export type MessageAvatarState = {
  /** The author's name. */
  name: string;
  /** Up to two letters of the name, or "?". */
  initials: string;
  /** The author's `avatarUrl`. */
  src: string | undefined;
};

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
      | "edit-actions"
      | "edit-cancel"
      | "edit-save"
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
      | "continue"
      | "delivery"
      | "retrying"
      | "retrying-icon",
      MessageSlot
    > & {
      avatar: MessageSlot<MessageAvatarState>;
      author: MessageSlot<{ name: string }>;
      time: MessageSlot<MessageTimeState>;
      duration: MessageSlot<{ label: string }>;
      "outcome-text": MessageSlot<{ text: string }>;
      "delivery-text": MessageSlot<{ text: string }>;
      withdraw: MessageSlot<{ label: string }>;
      resend: MessageSlot<{ label: string }>;
      "retrying-reason": MessageSlot<{ reason: string }>;
      "retrying-text": MessageSlot<{ text: string }>;
      "retry-now": MessageSlot<{ label: string }>;
      "cancel-retry": MessageSlot<{ label: string }>;
      "branch-label": MessageSlot<{ label: string }>;
      regenerate: MessageSlot<MessageRegenerateState>;
      "regenerate-content": MessageSlot<MessageRegenerateContentState>;
    }
  >
>;

const EDITING = "message";

const settled = (status: MessageStatus) => status !== "submitted" && status !== "streaming";

const outcomeOf = (status: string): MessageOutcome | null =>
  status === "aborted" ? "stopped" : status === "error" ? "failed" : null;
const ANNOUNCEMENTS: Record<MessageOutcome, string> = {
  stopped: "Response stopped",
  failed: "Response failed",
};
/**
 * The outcome's words: "Stopped", "Failed after 5 attempts" while `retry` is still set, or the `error` option's
 * words. Empty while there's no outcome.
 */
export const messageOutcomeText = (
  state: Pick<MessageState, "outcome" | "errorText"> & Partial<Pick<MessageState, "retryAttempt">>,
): string =>
  state.outcome === "stopped"
    ? "Stopped"
    : state.outcome !== "failed"
      ? ""
      : state.retryAttempt != null
        ? failedAfterText(state.retryAttempt)
        : state.errorText;

const DELIVERY_TEXT: Record<MessageDelivery, string> = {
  queued: WORDS.queuedNotSent,
  steering: WORDS.steering,
  "not-sent": WORDS.messageNotSent,
};
/** The footer's words: "Queued, not sent", "Steering…" or "Not sent". Empty once delivered. */
export const messageDeliveryText = (delivery: MessageDelivery | undefined): string =>
  delivery ? DELIVERY_TEXT[delivery] : "";
const DELIVERIES: ReadonlySet<string> = new Set(Object.keys(DELIVERY_TEXT));
const withdrawable = (state: MessageState) =>
  state.canWithdraw && (state.delivery === "queued" || state.delivery === "steering");
const retrying = (state: MessageState) => state.retryAttempt !== null && state.outcome === null;

/** The retry line's words after its reason, ticking with the countdown. */
export const messageRetryText = (
  state: Pick<MessageState, "retryAttempt" | "retryMaxAttempts" | "retrySeconds" | "locale">,
): string =>
  state.retryAttempt === null
    ? ""
    : retryText(
        { attempt: state.retryAttempt, maxAttempts: state.retryMaxAttempts },
        state.retrySeconds,
        state.locale,
      );
const NO_AVATAR: MessageAvatarState = { name: "", initials: "", src: undefined };

const hasHeader = (state: MessageState) =>
  (state.author !== undefined && !state.continued) ||
  (state.createdAt !== undefined && timeLabel(state.createdAt) !== "") ||
  durationLabel(state.durationSeconds) !== "";

// Web keeps Cancel and Save in the page, hidden, once the edit ends, so their focus recovery lets go as it ends.
const bindEditAction: NonNullable<MessageSlot["bind"]> = (el, part) => {
  let unbind: (() => void) | undefined;
  const follow = () => {
    if (part.store.get().editing !== null) unbind ??= part.api.editRecovery.bind(el, part);
    else {
      unbind?.();
      unbind = undefined;
    }
  };
  follow();
  const unsubscribe = part.store.subscribe(follow);
  return () => {
    unsubscribe();
    unbind?.();
  };
};

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
    outcome: outcomeOf(status),
    errorText: options.error || "Something went wrong",
    canRetry: options.onRetry !== undefined,
    canContinue: options.onContinue !== undefined,
    // A web `delivery` attribute can hold any string.
    delivery:
      role === "user" && options.delivery && DELIVERIES.has(options.delivery) ? options.delivery : undefined,
    canWithdraw: options.onWithdraw !== undefined,
    canResend: options.onResend !== undefined,
    // Flat, so a host passing a new `retry` object each render with the same fields changes nothing.
    retryAttempt: options.retry ? options.retry.attempt : null,
    retryMaxAttempts: options.retry?.maxAttempts,
    retryAfter: options.retry?.retryAfter,
    retryReason: options.retry?.reason || undefined,
    canRetryNow: options.onRetryNow !== undefined,
    canCancelRetry: options.onCancelRetry !== undefined,
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
    delivery: "string",
    onWithdraw: "action",
    onResend: "action",
    retry: "value",
    onRetryNow: "action",
    onCancelRetry: "action",
    motion: "string",
  },
  state: (options: MessageOptions): MessageState => ({
    ...menu.state(options),
    ...presentation(options),
    now: options.now || undefined,
    outcomePending: false,
    deliveryPending: false,
    retryPending: false,
    retrySeconds: null,
    editing: null,
    copied: false,
  }),
  sync: (options) => ({ ...menu.sync(options), ...presentation(options) }),
  live: ["retrySeconds"],
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
    const pendingDelivery = createPendingAction(context, { state: "deliveryPending" });
    const pendingRetry = createPendingAction(context, { state: "retryPending" });
    // Counted from when the host passes `retryAfter`, so a wrong device clock doesn't skew it.
    let counting = "";
    let retryAt: string | undefined;
    const retryCountdown = createCountdown(context, {
      key: "retrySeconds",
      minutes: true,
      at: () => {
        const { retryAttempt, retryAfter } = store.get();
        const key = retryAttempt === null ? "" : `${retryAttempt}:${retryAfter}`;
        if (key !== counting) {
          counting = key;
          retryAt =
            key && retryAfter !== undefined
              ? new Date(Date.now() + retryAfter * 1000).toISOString()
              : undefined;
        }
        return retryAt;
      },
    });
    let { delivery, retryAttempt } = store.get();
    // Web hosts set `retry` and `delivery` once the element exists, so nothing is announced before the first frame.
    let started = false;
    context.onOptions((options) => {
      const next = presentation(options);
      if (next.delivery !== delivery) {
        delivery = next.delivery;
        // A new delivery answers a withdraw or resend.
        pendingDelivery.release();
        if (started && delivery === "not-sent") announce(WORDS.messageNotSent, { priority: "polite" });
      }
      if (next.retryAttempt !== retryAttempt) {
        retryAttempt = next.retryAttempt;
        // A new attempt answers Retry now; the end of retrying answers Cancel.
        pendingRetry.release();
        if (started && retryAttempt !== null && next.outcome === null)
          announce(retryAnnouncement(retryAttempt), { priority: "polite" });
      }
    });
    const runDelivery = (
      pending: typeof pendingDelivery,
      name: "onWithdraw" | "onResend" | "onRetryNow" | "onCancelRetry",
      press: MessageDeliveryDetails["reason"],
      event?: Event,
      then?: (source: ChangeSource) => void,
    ) => {
      const call = context.options()[name];
      if (!call) return;
      const reason = event ? press : "imperative";
      const source = actionSource(event, reason);
      // A call that went through stays locked until the host answers it with new options.
      void pending
        .run(() => call({ reason, source }))
        ?.then((result) => {
          if (result !== "done") return;
          store.set(
            name === "onWithdraw" || name === "onResend" ? { deliveryPending: true } : { retryPending: true },
          );
          then?.(source);
        });
    };
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
      const outcome = outcomeOf(next);
      // Only for a response this instance saw being written, so a page of earlier messages is quiet.
      if (outcome && streamed)
        announce(
          outcome === "failed" && options.retry
            ? failedAfterText(options.retry.attempt)
            : ANNOUNCEMENTS[outcome],
          { priority: "polite" },
        );
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
    // Keyed by the fields, so a host passing a new `author` object each render keeps the avatar's state.
    const avatarState = memo(
      (name: string, src: string | undefined): MessageAvatarState => ({
        name,
        initials: avatarInitials(name),
        src,
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

    const editButton = () =>
      context.element("edit")?.querySelector<HTMLElement>("button:not([disabled])") ?? undefined;

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
      get withdraw() {
        const state = store.get();
        return withdrawable(state) && !state.deliveryPending
          ? (event?: Event) =>
              runDelivery(pendingDelivery, "onWithdraw", "withdraw-press", event, (source) =>
                insertTextNearby(context.element("root"), text(), source, "queue-edit"),
              )
          : undefined;
      },
      get resend() {
        const { canResend, delivery, deliveryPending } = store.get();
        return canResend && delivery === "not-sent" && !deliveryPending
          ? (event?: Event) => runDelivery(pendingDelivery, "onResend", "resend-press", event)
          : undefined;
      },
      get retryNow() {
        const state = store.get();
        return state.canRetryNow && retrying(state) && !state.retryPending
          ? (event?: Event) => runDelivery(pendingRetry, "onRetryNow", "retry-now-press", event)
          : undefined;
      },
      get cancelRetry() {
        const state = store.get();
        return state.canCancelRetry && retrying(state) && !state.retryPending
          ? (event?: Event) => runDelivery(pendingRetry, "onCancelRetry", "cancel-retry-press", event)
          : undefined;
      },
      bindRoot: () => {
        const frame = requestAnimationFrame(() => {
          started = true;
        });
        const stop = retryCountdown.bind();
        return () => {
          cancelAnimationFrame(frame);
          stop();
        };
      },
      deliveryRecovery: createFocusRecovery({
        fallback: () => {
          const root = context.element("root");
          return root?.isConnected ? nearestTabStop(root) : undefined;
        },
      }),
      // Exhausted, Retry takes their place; recovered, the toolbar.
      retryRecovery: createFocusRecovery({
        fallback: () => {
          const retry = context.element("retry")?.matches(":not([hidden])")
            ? context.element("retry")
            : undefined;
          const button = retry?.matches("button") ? retry : retry?.querySelector<HTMLElement>("button");
          const toolbar = context.element("toolbar")?.querySelector<HTMLElement>("button:not([disabled])");
          const root = context.element("root");
          return button ?? toolbar ?? (root?.isConnected ? nearestTabStop(root) : undefined);
        },
      }),
      readClock: () => {
        clock = true;
        const read = () => {
          const now = today(context.options());
          if (now !== store.get().now) store.set({ now });
        };
        read();
        return everyMinute(read);
      },
      // Retry and Continue leave as a new response starts, before the toolbar is back, so focus moves past the
      // message, usually to the composer.
      outcomeRecovery: createFocusRecovery({
        fallback: () => {
          const toolbar = context.element("toolbar")?.querySelector<HTMLElement>("button:not([disabled])");
          const root = context.element("root");
          return toolbar ?? (root?.isConnected ? nearestTabStop(root) : undefined);
        },
      }),
      avatarState: (state) =>
        state.author ? avatarState(state.author.name, state.author.avatarUrl || undefined) : NO_AVATAR,
      timeState: (state) => timeState(state.createdAt ?? "", state.locale, state.timeZone, state.now),
      inlineEdit,
      // React renders the toolbar back after the recovery has looked for Edit, so Edit takes focus once it's there.
      editKeydown: (event) => {
        if (inlineEdit.inputKeydown(event) && store.get().editing === null) keepFocus(editButton);
      },
      saveEdit: (event) => {
        if (inlineEdit.end("imperative", event)) keepFocus(editButton);
      },
      cancelEdit: () => {
        inlineEdit.cancel();
        keepFocus(editButton);
      },
      editFocusOut: (event) => {
        const next = event.relatedTarget;
        const within = (name: "editor" | "edit-actions") =>
          next instanceof Node && Boolean(context.element(name)?.contains(next));
        if (!within("editor") && !within("edit-actions")) inlineEdit.end("focus-out", event);
      },
      editRecovery: createFocusRecovery({ fallback: editButton }),
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
      attrs: (state, part) => ({
        "data-role": state.role,
        "data-status": state.status,
        "data-editing": state.editing === null ? undefined : "",
        "data-continued": state.continued ? "" : undefined,
        "data-delivery": state.delivery,
        "aria-busy": state.outcomePending ? "true" : undefined,
        "aria-describedby": state.delivery ? `${part.id}-delivery` : undefined,
      }),
      bind: (_el, { api }) => api.bindRoot(),
    }),
    avatar: slot<BaseSlotProps, MessageAvatarState>({
      state: (state, { api }) => api.avatarState(state),
      // With an `author`, the name beside it says who wrote it.
      attrs: (state) => ({
        "data-role": state.role,
        "data-continued": state.continued ? "" : undefined,
        "aria-hidden": state.author ? "true" : undefined,
        "data-author": state.author ? (state.author.kind ?? "") : undefined,
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
      attrs: (state) => ({ dateTime: state.createdAt }),
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
        keydown: (event, { api }) => {
          const key = event as KeyboardEvent;
          // Tab moves on to Cancel and Save, which save when focus leaves them.
          if (key.key === "Tab" && !key.shiftKey) return;
          api.editKeydown(key);
        },
        focusout: (event, { api }) => api.editFocusOut(event as FocusEvent),
      },
      bind: (el, { api }) => api.inlineEdit.bindInput(el as HTMLTextAreaElement),
    }),
    // Cancel and Save, after the editor: a press keeps focus in the editor, so pressing Cancel doesn't save first.
    "edit-actions": slot({
      present: (state) => state.editing !== null,
      attrs: (state) => ({ "data-role": state.role }),
      on: {
        mousedown: (event) => event.preventDefault(),
        focusout: (event, { api }) => api.editFocusOut(event as FocusEvent),
        keydown: (event, { api }) => {
          if ((event as KeyboardEvent).key !== "Escape") return;
          event.preventDefault();
          api.cancelEdit();
        },
      },
    }),
    "edit-cancel": slot({
      role: "button",
      focus: "native",
      press: ({ api }) => api.cancelEdit(),
      attrs: () => ({ type: "button", "data-kind-button": "" }),
      bind: bindEditAction,
    }),
    "edit-save": slot({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.saveEdit(event),
      attrs: () => ({ type: "button", "data-kind-button": "primary" }),
      bind: bindEditAction,
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
    // Under the user's bubble while it isn't with the agent yet: its words, then Withdraw or Retry.
    delivery: slot({
      present: (state) => state.delivery !== undefined,
      attrs: (state) => ({ "data-delivery": state.delivery, "data-motion": state.motion }),
    }),
    "delivery-text": slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: messageDeliveryText(state.delivery) }),
      attrs: (state, part) => ({ id: `${part.id}-delivery`, "data-delivery": state.delivery }),
    }),
    withdraw: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: withdrawable,
      state: () => ({ label: WORDS.withdraw }),
      press: ({ api }, event) => api.withdraw?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.deliveryPending ? "true" : undefined,
        "data-kind-button": "",
        "data-kind-size": "sm",
      }),
      bind: (el, part) => part.api.deliveryRecovery.bind(el, part),
    }),
    resend: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canResend && state.delivery === "not-sent",
      state: () => ({ label: "Retry" }),
      press: ({ api }, event) => api.resend?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.deliveryPending ? "true" : undefined,
        "data-kind-button": "",
        "data-kind-size": "sm",
      }),
      bind: (el, part) => part.api.deliveryRecovery.bind(el, part),
    }),
    // Where the outcome goes, so the streamed text above stays put. A status whose countdown is never read out: each
    // attempt is announced once instead.
    retrying: slot({
      role: "status",
      present: retrying,
      attrs: (state) => ({ "aria-live": "off", "data-motion": state.motion }),
    }),
    "retrying-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "running",
        "data-motion": state.motion,
      }),
    }),
    "retrying-reason": slot<BaseSlotProps, { reason: string }>({
      present: (state) => state.retryReason !== undefined,
      state: (state) => ({ reason: retryReason(state.retryReason) }),
    }),
    "retrying-text": slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: messageRetryText(state) }),
    }),
    "retry-now": slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canRetryNow && retrying(state),
      state: () => ({ label: WORDS.retryNow }),
      press: ({ api }, event) => api.retryNow?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.retryPending ? "true" : undefined,
        "data-kind-button": "secondary",
        "data-kind-size": "sm",
      }),
      bind: (el, part) => part.api.retryRecovery.bind(el, part),
    }),
    "cancel-retry": slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canCancelRetry && retrying(state),
      state: () => ({ label: "Cancel" }),
      press: ({ api }, event) => api.cancelRetry?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.retryPending ? "true" : undefined,
        "data-kind-button": "",
        "data-kind-size": "sm",
      }),
      bind: (el, part) => part.api.retryRecovery.bind(el, part),
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
        "data-kind-button": "secondary",
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
        "data-kind-button": "secondary",
      }),
      bind: (el, part) => part.api.outcomeRecovery.bind(el, part),
    }),
    // Cancel and Save take its place while the message is edited.
    toolbar: slot({
      present: (state) => settled(state.status) && state.editing === null,
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
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
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
        "data-kind-icon-button": "",
        "data-kind-size": "sm",
        "aria-disabled": state.branchIndex >= state.branchCount - 1 ? "true" : undefined,
      }),
    }),
  }),
  agent: {
    actions: [
      "copy",
      "regenerate",
      "edit",
      "setBranch",
      "retry",
      "continue",
      "withdraw",
      "resend",
      "retryNow",
      "cancelRetry",
    ],
    items: (api) =>
      menuItems(api.regenerateMenu.getItems()).filter((item) => item.value !== MESSAGE_TRY_AGAIN),
    closed: true,
  },
});
