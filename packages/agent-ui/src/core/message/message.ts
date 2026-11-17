import {
  type ChangeDetails,
  type ChangeSource,
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
import type { MessageStatus, RegenerateOption, Role } from "../../types/index.js";
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
  /** Plays the toolbar's entrance when the message settles while mounted, not when it mounts settled. */
  enterToolbar: (el: HTMLElement) => void;
  /** The regenerate menu, built on `menuBase`. */
  regenerateMenu: MenuBaseApi;
  /** The regenerate and regenerate-content slots' states, memoized. */
  regenerateState: (state: MessageState) => MessageRegenerateState;
  regenerateContentState: (state: MessageState) => MessageRegenerateContentState;
};

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
      | "avatar"
      | "content"
      | "editor"
      | "toolbar"
      | "copy"
      | "regenerate-trigger"
      | "edit"
      | "branch"
      | "branch-previous"
      | "branch-next",
      MessageSlot
    > & {
      "branch-label": MessageSlot<{ label: string }>;
      regenerate: MessageSlot<MessageRegenerateState>;
      "regenerate-content": MessageSlot<MessageRegenerateContentState>;
    }
  >
>;

const EDITING = "message";

const settled = (status: MessageStatus) => status !== "submitted" && status !== "streaming";

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
  onAction: (value, { event, source, keepOpen }, context) => {
    // `menuBase` types the context with its own state; it's Message's.
    if (!runRegenerate(context as Context, value, { reason: "item-press", event, source })) keepOpen();
  },
});

const presentation = (options: MessageOptions) => {
  const role = options.messageRole ?? "assistant";
  return {
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
    motion: "string",
  },
  state: (options: MessageOptions): MessageState => ({
    ...menu.state(options),
    ...presentation(options),
    editing: null,
    copied: false,
  }),
  sync: (options) => ({ ...menu.sync(options), ...presentation(options) }),
  controlled: ["branchIndex", "branchCount", "status"],
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
    context.onOptions((options) => {
      if (!settled(options.status ?? "complete")) streamed = true;
    });

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
        return (optionId?: string, event?: Event) =>
          runRegenerate(context, optionId, { reason: event ? "regenerate-press" : "imperative", event });
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
      }),
    }),
    avatar: slot({
      attrs: (state) => ({ "data-role": state.role }),
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
    actions: ["copy", "regenerate", "edit", "setBranch"],
    items: (api) =>
      menuItems(api.regenerateMenu.getItems()).filter((item) => item.value !== MESSAGE_TRY_AGAIN),
    closed: true,
  },
});
