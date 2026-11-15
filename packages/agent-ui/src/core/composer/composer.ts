import {
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  createInputHistory,
  definePrimitive,
  isComposing,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { FileInputOptions, FileInputValueChangeReason } from "@ui-sdk/core/file-input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import {
  createTokenInputController,
  fromText,
  type TokenInputController,
  type TokenInputOptions,
  type TokenInputValue,
  toText,
} from "@ui-sdk/core/token-input";
import type { TriggerDefinition } from "@ui-sdk/core/trigger-menu";
import type { AttachmentsOptions } from "../attachments/index.js";
import type { MotionMode } from "../motion/index.js";
import {
  type ComposerAttachment,
  type ComposerDraft,
  type ComposerToken,
  type ComposerTriggerItem,
  draftAfterSettle,
  emptyDraft,
  isSubmittable,
} from "./draft.js";
import { type FileIntake, forwardFileInputEvents } from "./file-input-events.js";

/** Typing and tokens, a File Input change, a settled submission, or an `api` call. */
export type ComposerValueChangeReason = "input-change" | FileInputValueChangeReason | "submit";

export type ComposerOptions = {
  /** Controlled draft. Don't pass with `defaultValue`. */
  value?: ComposerDraft;
  /** Uncontrolled initial draft. */
  defaultValue?: ComposerDraft;
  onValueChange?: (value: ComposerDraft, details: ChangeDetails<ComposerValueChangeReason>) => void;
  /**
   * Called with a snapshot of the draft on submit. A returned thenable keeps `pending` until it settles:
   * resolving clears the draft unless it changed meanwhile, rejecting keeps it.
   */
  onSubmit?: (draft: ComposerDraft) => unknown;
  /** Offers the stop control and action while a submission is pending. */
  onStop?: () => void;
  /** Which keys submit. `"enter"` (default) takes Shift+Enter as a new line; `"mod-enter"` takes Enter as one. */
  submitOn?: "enter" | "mod-enter";
  /** What `@` suggests. */
  mentions?: readonly ComposerTriggerItem[];
  /** What `/` at the start of a line suggests. */
  commands?: readonly ComposerTriggerItem[];
  /** The files to accept, like the `accept` attribute. Others attach with an error. */
  accept?: string;
  /** The largest file accepted, in bytes. Larger ones attach with an error. */
  maxSize?: number;
  /** Earlier prompts as draft `text`, oldest first. ArrowUp in an empty field brings them back. */
  history?: readonly string[];
  disabled?: boolean;
  /**
   * Writes `data-agent-confirm` on the form, so an agent needs a person to send. The bridge applies the mark
   * to every composer action, not just `submit`; a host's `allow` can let the others through. Defaults to `true`.
   */
  agentConfirm?: boolean;
  /** Defaults to `"auto"`, which follows `prefers-reduced-motion`. */
  motion?: MotionMode;
};

export type ComposerState = {
  value: ComposerDraft;
  pending: boolean;
  /** Whether `onStop` is set. */
  canStop: boolean;
  disabled: boolean;
  submitOn: "enter" | "mod-enter";
  agentConfirm: boolean;
  mentions: readonly ComposerTriggerItem[] | undefined;
  commands: readonly ComposerTriggerItem[] | undefined;
  accept: string | undefined;
  maxSize: number | undefined;
  motion: MotionMode;
};

type TokenToInsert = Omit<ComposerToken, "id">;

export type ComposerApi = {
  /** The current draft; the owner's `value` when controlled. */
  getValue: () => ComposerDraft;
  /** A string replaces the text and keeps the attachments. */
  setValue: (value: ComposerDraft | string, event?: Event) => boolean;
  /** Inserts a mention or command at the caret. */
  insertToken: (token: TokenToInsert) => boolean;
  removeAttachment: (id: string, event?: Event) => boolean;
  submit: (event?: Event) => void;
  /** Present only while a submission is pending and `onStop` is set. */
  readonly stop: ((event?: Event) => void) | undefined;
  /** Drives the Token Input; render layers pass it as its `controller`. */
  tokenInput: TokenInputController;
  /** Takes in what File Input accepted or rejected. */
  intake: FileIntake;
  /** Reads the Token Input into the draft after an edit. */
  readInput: () => void;
  history: ReturnType<typeof createInputHistory<string>>;
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Each part's state for render functions, kept while what it's built from stays the same. */
  partState: {
    root: (state: ComposerState) => ComposerRootState;
    input: (state: ComposerState) => ComposerInputState;
    triggerMenu: (state: ComposerState) => ComposerTriggerMenuState;
    attachments: (state: ComposerState) => ComposerAttachmentsState;
  };
};

export type ComposerRootState = {
  /** Props for the File Input around the form's content. */
  fileInput: Pick<
    FileInputOptions,
    "accept" | "maxSize" | "multiple" | "disabled" | "onValueChange" | "onReject"
  >;
  /** The File Input drop zone's `pasteTarget`: the editor, so pasted files attach. */
  pasteTarget: () => Element | undefined;
};

export type ComposerInputState = {
  /** Props for the Token Input inside the input part. */
  tokenInput: Pick<TokenInputOptions, "controller" | "defaultValue" | "submitShortcut" | "disabled">;
};

export type ComposerTriggerMenuState = { triggers: TriggerDefinition[] };

/** Props for the Attachments inside the attachments part. */
export type ComposerAttachmentsState = Required<Pick<AttachmentsOptions, "items" | "onRemove" | "motion">>;

type ComposerSlot<Public extends object = Record<never, never>> = SlotDefinition<
  ComposerState,
  ComposerApi,
  BaseSlotProps,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ComposerPrimitive = ReturnType<
  typeof definePrimitive<
    ComposerOptions,
    ComposerState,
    ComposerApi,
    {
      root: ComposerSlot<ComposerRootState>;
      input: ComposerSlot<ComposerInputState>;
      "trigger-menu": ComposerSlot<ComposerTriggerMenuState>;
      attachments: ComposerSlot<ComposerAttachmentsState>;
      submit: ComposerSlot;
      stop: ComposerSlot;
    }
  >
>;

// A part re-renders when its state changes identity, so state built from the same inputs is reused.
function memo<Args extends unknown[], Value>(build: (...args: Args) => Value): (...args: Args) => Value {
  let last: { args: Args; value: Value } | undefined;
  return (...args) => {
    if (last?.args.every((arg, index) => Object.is(arg, args[index]))) return last.value;
    last = { args, value: build(...args) };
    return last.value;
  };
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === "function";

// A token parsed from text has no id until the Token Input holds it.
const tokensOf = (segments: TokenInputValue): ComposerToken[] =>
  segments.flatMap((segment, index) =>
    typeof segment !== "string" && (segment.type === "mention" || segment.type === "command")
      ? [{ id: segment.id ?? String(index), kind: segment.type, value: segment.value, label: segment.label }]
      : [],
  );

// The editor counts a token as one offset.
const lengthOf = (segments: TokenInputValue) =>
  segments.reduce((length, segment) => length + (typeof segment === "string" ? segment.length : 1), 0);

const presentation = (options: ComposerOptions) => ({
  canStop: options.onStop !== undefined,
  disabled: options.disabled ?? false,
  submitOn: options.submitOn ?? "enter",
  agentConfirm: options.agentConfirm ?? true,
  mentions: options.mentions,
  commands: options.commands,
  accept: options.accept,
  maxSize: options.maxSize,
  motion: options.motion ?? "auto",
});

export const composerPrimitive: ComposerPrimitive = definePrimitive({
  name: "kind-composer",
  options: {
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    onSubmit: "action",
    onStop: "callback",
    submitOn: "string",
    mentions: "value",
    commands: "value",
    accept: "string",
    maxSize: "number",
    history: "value",
    disabled: "boolean",
    agentConfirm: "boolean",
    motion: "string",
  },
  state: (options: ComposerOptions): ComposerState => {
    if (options.value !== undefined && options.defaultValue !== undefined) {
      throw new TypeError("Composer: value and defaultValue are mutually exclusive");
    }
    return {
      ...presentation(options),
      value: options.value ?? options.defaultValue ?? emptyDraft(),
      pending: false,
    };
  },
  sync: (options: ComposerOptions) => ({
    ...presentation(options),
    ...(options.value === undefined ? {} : { value: options.value }),
  }),
  controlled: ["value"],
  api: (context): ComposerApi => {
    const { store } = context;
    const change = createChange(context);
    const tokenInput = createTokenInputController();
    let destroyed = false;
    context.onDestroy(() => {
      destroyed = true;
    });

    const setValue = (value: ComposerDraft | string, event?: Event) => {
      const next =
        typeof value === "string"
          ? { text: value, tokens: tokensOf(fromText(value)), attachments: store.get().value.attachments }
          : value;
      return change("value", next, event ? { reason: "input-change", event } : { reason: "imperative" });
    };

    let nextAttachment = 0;
    const attach = (attachments: ComposerAttachment[], reason: FileInputValueChangeReason) => {
      if (attachments.length === 0) return;
      const { value } = store.get();
      change("value", { ...value, attachments: [...value.attachments, ...attachments] }, { reason });
    };
    const attachment = (file: File, error?: ComposerAttachment["error"]): ComposerAttachment => ({
      id: `${context.id}-attachment-${nextAttachment++}`,
      file,
      name: file.name,
      size: file.size,
      mediaType: file.type,
      ...(error ? { error } : {}),
    });

    const settle = (submitted: ComposerDraft, outcome: "resolved" | "rejected") => {
      if (destroyed) return;
      store.set({ pending: false });
      if (outcome === "rejected") announce("Message not sent", { priority: "polite" });
      const current = store.get().value;
      const next = draftAfterSettle(current, submitted, outcome);
      if (next !== current) change("value", next, { reason: "submit" });
    };

    const history = createInputHistory<string>({
      entries: () => context.options().history,
      read: () => store.get().value.text,
      write: (text, event) => setValue(text, event),
      atEdge: (direction) => {
        const length = lengthOf(tokenInput.getValue());
        // The editor reports no selection until the first `selectionchange` after focus.
        if (length === 0) return true;
        const range = tokenInput.editor.selection();
        if (!range || range.start !== range.end) return false;
        return direction === "up" ? range.start === 0 : range.end === length;
      },
    });

    // Send and Stop take each other's place; focus follows to whichever is shown, else the editor.
    const recovery = createFocusRecovery({
      fallback: () => context.element("stop") ?? context.element("submit") ?? tokenInput.editor.element,
    });

    const intake: FileIntake = {
      accept: (files, reason, cancel) => {
        // The draft holds the files, so File Input keeps none of its own.
        cancel();
        attach(
          files.map((file) => attachment(file)),
          reason,
        );
      },
      reject: (rejected, reason) =>
        attach(
          rejected.map(({ file, reasons }) =>
            attachment(file, reasons.includes("file-type") ? "type" : "size"),
          ),
          reason,
        ),
    };
    const removeAttachment = (id: string, event?: Event) => {
      const { value } = store.get();
      if (!value.attachments.some((item) => item.id === id)) return false;
      return change(
        "value",
        { ...value, attachments: value.attachments.filter((item) => item.id !== id) },
        event ? { reason: "remove-press", event } : { reason: "imperative" },
      );
    };
    const initialText = fromText(store.get().value.text);

    const root = memo(
      (disabled: boolean, accept: string | undefined, maxSize: number | undefined): ComposerRootState => ({
        fileInput: {
          multiple: true,
          disabled,
          ...(accept === undefined ? {} : { accept }),
          ...(maxSize === undefined ? {} : { maxSize }),
          onValueChange: (_files, details) => intake.accept(details.added, details.reason, details.cancel),
          onReject: (rejected, details) => intake.reject(rejected, details.reason),
        },
        pasteTarget: () => tokenInput.editor.element,
      }),
    );
    const input = memo(
      (submitOn: ComposerState["submitOn"], disabled: boolean): ComposerInputState => ({
        tokenInput: {
          controller: tokenInput,
          defaultValue: initialText,
          submitShortcut: submitOn === "mod-enter" ? "mod+enter" : "enter",
          disabled,
        },
      }),
    );
    const triggerMenu = memo(
      (
        mentions: ComposerState["mentions"],
        commands: ComposerState["commands"],
      ): ComposerTriggerMenuState => {
        const triggers: TriggerDefinition[] = [];
        if (mentions) triggers.push({ char: "@", type: "mention", items: [...mentions] });
        if (commands) triggers.push({ char: "/", boundary: "start", type: "command", items: [...commands] });
        return { triggers };
      },
    );
    const attachments = memo(
      (items: ComposerAttachment[], motion: MotionMode): ComposerAttachmentsState => ({
        items,
        onRemove: (id, details) => void removeAttachment(id, details.event),
        motion,
      }),
    );

    return {
      getValue: () => store.get().value,
      setValue,
      insertToken: ({ kind, value, label }) => tokenInput.insert({ type: kind, value, label }) === true,
      removeAttachment,
      submit: () => {
        const { onSubmit } = context.options();
        const { value, pending, disabled } = store.get();
        if (disabled || pending || !onSubmit || !isSubmittable(value)) return;
        history.reset();
        const submission = onSubmit(value);
        if (!isThenable(submission)) return settle(value, "resolved");
        store.set({ pending: true });
        announce("Sending", { priority: "polite" });
        submission.then(
          () => settle(value, "resolved"),
          () => settle(value, "rejected"),
        );
      },
      get stop() {
        const { pending } = store.get();
        const { onStop } = context.options();
        return pending && onStop ? () => onStop() : undefined;
      },
      tokenInput,
      intake,
      readInput: () => {
        const segments = tokenInput.getValue();
        const { value } = store.get();
        const text = toText(segments);
        if (text === value.text) return;
        change("value", { ...value, text, tokens: tokensOf(segments) }, { reason: "input-change" });
      },
      history,
      recovery,
      partState: {
        root: (state) => root(state.disabled, state.accept, state.maxSize),
        input: (state) => input(state.submitOn, state.disabled),
        triggerMenu: (state) => triggerMenu(state.mentions, state.commands),
        attachments: (state) => attachments(state.value.attachments, state.motion),
      },
    };
  },
  slots: (slot) => ({
    root: slot<BaseSlotProps, ComposerRootState>({
      role: "form",
      attrs: (state) => ({
        "data-pending": state.pending ? "" : undefined,
        "data-disabled": state.disabled ? "" : undefined,
        "data-motion": state.motion,
        "aria-busy": state.pending ? "true" : undefined,
        // UI SDK marks a whole component, so every composer action asks the person while it's on.
        "data-agent-confirm": state.agentConfirm ? "Writes and sends a message as you" : undefined,
      }),
      state: (state, { api }) => api.partState.root(state),
      on: {
        submit: (event, { api }) => {
          event.preventDefault();
          api.submit(event);
        },
      },
      bind: (el, { api }) => forwardFileInputEvents(el, api.intake),
    }),
    // Wraps the Token Input and hears its keys bubble, for ArrowUp history (spec §2, composing UI SDK).
    input: slot<BaseSlotProps, ComposerInputState>({
      attrs: (state) => ({ "data-pending": state.pending ? "" : undefined }),
      state: (state, { api }) => api.partState.input(state),
      on: {
        keydown: (event, { api }) => {
          const key = event as KeyboardEvent;
          if (key.defaultPrevented || isComposing(key) || key.altKey || key.ctrlKey || key.metaKey) return;
          if (!key.shiftKey) api.history.keydown(key);
        },
      },
      bind: (_el, { api, store }) => {
        const write = () => {
          const { text } = store.get().value;
          // The controller reads undefined until the Token Input attaches it.
          if (toText(api.tokenInput.getValue() ?? []) !== text) api.tokenInput.setValue(fromText(text));
        };
        write();
        const unsubscribe = store.subscribe(write);
        const unlisten = api.tokenInput.editor.subscribe((edit) => {
          if (edit.type === "input") api.readInput();
        });
        return () => {
          unsubscribe();
          unlisten();
        };
      },
    }),
    "trigger-menu": slot<BaseSlotProps, ComposerTriggerMenuState>({
      state: (state, { api }) => api.partState.triggerMenu(state),
    }),
    attachments: slot<BaseSlotProps, ComposerAttachmentsState>({
      present: (state) => state.value.attachments.length > 0,
      state: (state, { api }) => api.partState.attachments(state),
    }),
    submit: slot({
      role: "button",
      focus: "native",
      present: (state) => !(state.pending && state.canStop),
      press: ({ api }, event) => api.submit(event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Send",
        "aria-disabled": state.pending || state.disabled || !isSubmittable(state.value) ? "true" : undefined,
        "data-pending": state.pending ? "" : undefined,
        "data-motion": state.motion,
      }),
      // Keeps focus in the editor when a pointer presses it.
      on: { mousedown: (event) => event.preventDefault() },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    stop: slot({
      role: "button",
      focus: "native",
      present: (state) => state.pending && state.canStop,
      press: ({ api }, event) => api.stop?.(event),
      attrs: (state) => ({ type: "button", "aria-label": "Stop", "data-motion": state.motion }),
      on: { mousedown: (event) => event.preventDefault() },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
  }),
  agent: { actions: ["setValue", "insertToken", "removeAttachment", "submit", "stop"] },
});
