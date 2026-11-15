import {
  type ChangeDetails,
  createInlineEdit,
  definePrimitive,
  dispatch,
  type InlineEdit,
  type InlineEditReason,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { MessageStatus, Role } from "../../types/index.js";
import { createCopy } from "../clipboard.js";
import { enter, type MotionMode } from "../motion/index.js";

/** The branch switcher's text: `"2 of 3"` for the second of three. */
export const branchLabel = (index: number, count: number): string => `${index + 1} of ${count}`;

export type MessageBranchChangeReason = "previous-press" | "next-press" | "imperative";

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
  /** Called to ask for a new response. Shows the regenerate action while set. */
  onRegenerate?: (text: string, details: ChangeDetails<"regenerate-press" | "imperative">) => void;
  /** Called with the new text when someone saves an edit. Shows the edit action on user messages while set. */
  onEdit?: (text: string, details: ChangeDetails<InlineEditReason>) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type MessageState = {
  /** The `messageRole` option. */
  role: Role;
  status: MessageStatus;
  branchIndex: number;
  branchCount: number;
  /** Whether `onRegenerate` is set. */
  canRegenerate: boolean;
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
  /** Calls `onRegenerate`. Offered once the message settles, while `onRegenerate` is set. */
  readonly regenerate: ((event?: Event) => void) | undefined;
  /** Starts editing in place. Offered once a user message with `onEdit` settles. */
  readonly edit: ((event?: Event) => void) | undefined;
  /** Asks `onBranchChange` for the response at an index, from 0. Offered when there's more than one. */
  readonly setBranch: ((index: number, event?: Event) => void) | undefined;
  inlineEdit: InlineEdit;
  /** Plays the toolbar's entrance when the message settles while mounted, not when it mounts settled. */
  enterToolbar: (el: HTMLElement) => void;
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
      | "regenerate"
      | "edit"
      | "branch"
      | "branch-previous"
      | "branch-next",
      MessageSlot
    > & { "branch-label": MessageSlot<{ label: string }> }
  >
>;

const EDITING = "message";

const settled = (status: MessageStatus) => status !== "submitted" && status !== "streaming";

const presentation = (options: MessageOptions) => {
  const role = options.messageRole ?? "assistant";
  return {
    role,
    status: options.status ?? "complete",
    branchIndex: options.branchIndex ?? 0,
    branchCount: options.branchCount ?? 1,
    canRegenerate: options.onRegenerate !== undefined,
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
    onEdit: "callback",
    motion: "string",
  },
  state: (options: MessageOptions): MessageState => ({
    ...presentation(options),
    editing: null,
    copied: false,
  }),
  sync: presentation,
  controlled: ["branchIndex", "branchCount", "status"],
  api: (context): MessageApi => {
    const { store } = context;
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
        return (event?: Event) =>
          void dispatch(
            context,
            "onRegenerate",
            text(),
            event ? { reason: "regenerate-press", event } : { reason: "imperative" },
          );
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
    regenerate: slot({
      present: (state) => state.canRegenerate,
      on: { click: (event, { api }) => api.regenerate?.(event) },
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
  agent: { actions: ["copy", "regenerate", "edit", "setBranch"] },
});
