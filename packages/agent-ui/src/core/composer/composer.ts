import {
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  createInputHistory,
  definePrimitive,
  type SlotDefinition,
  type ValueStorage,
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
import { type FileIntake, forwardFileInputEvents } from "../file-input-events.js";
import { memo } from "../memo.js";
import { cancel, enter, exit, type MotionMode } from "../motion/index.js";
import {
  type ComposerAttachment,
  type ComposerDraft,
  type ComposerToken,
  type ComposerTriggerItem,
  draftAfterSettle,
  emptyDraft,
  isSubmittable,
  readSavedDraft,
  saveDraft,
} from "./draft.js";

/**
 * `"input-change"`: typing, tokens or `setValue` with an event. `"history-key"`: ArrowUp or ArrowDown brought
 * back an earlier prompt. `"picker"`, `"drop"`, `"paste"`, `"reset"`: File Input attached files.
 * `"remove-press"`: an attachment was removed. `"submit"`: a resolved submission cleared the draft.
 * `"restore"`: the draft saved under `draftKey` came back. `"discard-press"`: Discard emptied it.
 * `"imperative"`: an `api` call without an event.
 */
export type ComposerValueChangeReason =
  | "input-change"
  | "history-key"
  | FileInputValueChangeReason
  | "submit"
  | "restore"
  | "discard-press";

export type ComposerOptions = {
  /** The draft. Passing it controls it: change it in `onValueChange`. Don't pass it with `defaultValue`. */
  value?: ComposerDraft;
  /** The draft at first, when `value` isn't passed. */
  defaultValue?: ComposerDraft;
  /** Called when the draft changes, with what caused it. Cancel `details` to refuse the change. */
  onValueChange?: (value: ComposerDraft, details: ChangeDetails<ComposerValueChangeReason>) => void;
  /**
   * Called with the draft when it's sent. Return a promise to keep the composer pending: resolving clears the
   * draft unless it changed meanwhile, and rejecting keeps it. Otherwise the draft clears right away.
   */
  onSubmit?: (draft: ComposerDraft) => unknown;
  /** Called when Stop is pressed. While it's set, Stop takes Send's place during a pending submission. */
  onStop?: () => void;
  /**
   * Which keys send. With `"enter"`, Shift+Enter starts a new line; with `"mod-enter"`, Enter does.
   * @default "enter"
   */
  submitOn?: "enter" | "mod-enter";
  /** What typing `@` suggests. */
  mentions?: readonly ComposerTriggerItem[];
  /** What typing `/` at the start of a line suggests. */
  commands?: readonly ComposerTriggerItem[];
  /** The file types to accept, like the `accept` attribute. Other files attach with an error. */
  accept?: string;
  /** The largest file to accept, in bytes. Larger files attach with an error. */
  maxSize?: number;
  /** Earlier prompts, oldest first, that ArrowUp brings back. */
  history?: readonly string[];
  /**
   * Names the conversation whose draft `draftStorage` keeps. With both, an uncontrolled draft's text and tokens are
   * saved as they change, and a composer that mounts with an empty draft, or whose `draftKey` changes while it's
   * empty, gets that key's draft back. A controlled `value` is never saved or restored.
   */
  draftKey?: string;
  /**
   * Where drafts are kept, from UI SDK's `createLocalStorage` or `createSessionStorage`. One storage holds every
   * `draftKey`'s draft. Storage that fails is ignored.
   */
  draftStorage?: ValueStorage;
  /**
   * Stops editing, attaching, sending and every agent action.
   * @default false
   */
  disabled?: boolean;
  /**
   * Makes an agent ask a person before it runs any composer action, unless the host's `allow` lets it through.
   * @default true
   */
  agentConfirm?: boolean;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ComposerState = {
  /** The draft: its text, tokens and attachments. */
  value: ComposerDraft;
  /** Whether a submission is in flight; Send is locked until it settles. */
  pending: boolean;
  /** Whether the attachments part is collapsing after its last chip was removed; it stays shown until it ends. */
  attachmentsClosing: boolean;
  /** Whether the draft came back from `draftStorage` and hasn't been edited since; "Draft restored" shows. */
  restored: boolean;
  /** Whether `onStop` is set, so Stop takes Send's place while pending. */
  canStop: boolean;
  /** The options of the same name, with their defaults. */
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
  /** Replaces the draft. A string replaces only the text and keeps the attachments. Returns whether the change was accepted. */
  setValue: (value: ComposerDraft | string, event?: Event) => boolean;
  /** Inserts a mention or command at the caret. Returns whether it was inserted. */
  insertToken: (token: TokenToInsert) => boolean;
  /** Removes an attachment from the draft by its `id`. Returns whether the change was accepted. */
  removeAttachment: (id: string, event?: Event) => boolean;
  /** Sends the draft, unless there's nothing to send, it's pending or disabled, or `onSubmit` isn't set. */
  submit: (event?: Event) => void;
  /** Calls `onStop`. Offered only while a submission is pending and `onStop` is set. */
  readonly stop: ((event?: Event) => void) | undefined;
  /** Empties a restored draft and removes it from `draftStorage`. Offered only while "Draft restored" shows. */
  readonly discardDraft: ((event?: Event) => void) | undefined;
  /** Restores the saved draft and keeps saving it while the root is in the page. Returns a cleanup. */
  bindDraft: () => () => void;
  /** Drives the Token Input; render layers pass it as its `controller`. */
  tokenInput: TokenInputController;
  /** Takes in what File Input accepted or rejected. */
  intake: FileIntake;
  /**
   * Starts syncing the draft and the Token Input once the Token Input has attached the controller, which on web
   * can happen after the input part binds. Returns a cleanup; calling it again while connected does nothing.
   */
  connectInput: () => () => void;
  history: ReturnType<typeof createInputHistory<string>>;
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Moves focus to the editor when Discard leaves while focused. */
  discardRecovery: ReturnType<typeof createFocusRecovery>;
  /** Plays Send's entrance when it comes back from Stop, not when the composer mounts. */
  enterSubmit: (el: HTMLElement) => void;
  /** Expands the attachments part as its first chip arrives, and collapses it once the last is removed. */
  bindAttachments: (el: HTMLElement) => () => void;
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
};

export type ComposerInputState = {
  /** Props for the Token Input inside the input part. */
  tokenInput: Pick<TokenInputOptions, "controller" | "defaultValue" | "submitShortcut" | "disabled">;
};

export type ComposerTriggerMenuState = { triggers: TriggerDefinition[] };

/**
 * Props for the Attachments inside the attachments part. `onRemove` is left out while the composer is disabled, and
 * focus goes to the editor when the last chip leaves.
 */
export type ComposerAttachmentsState = Required<
  Pick<AttachmentsOptions, "items" | "motion" | "focusFallback">
> &
  Pick<AttachmentsOptions, "onRemove">;

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
      restored: ComposerSlot;
      discard: ComposerSlot;
    }
  >
>;

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
    draftKey: "string",
    draftStorage: "value",
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
      attachmentsClosing: false,
      restored: false,
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
      returningFromStop = store.get().canStop;
      store.set({ pending: false });
      if (outcome === "rejected") announce("Message not sent", { priority: "polite" });
      const current = store.get().value;
      const next = draftAfterSettle(current, submitted, outcome);
      if (next !== current) change("value", next, { reason: "submit" });
    };

    const history = createInputHistory<string>({
      entries: () => context.options().history,
      read: () => store.get().value.text,
      write: (text, event) =>
        change(
          "value",
          { text, tokens: tokensOf(fromText(text)), attachments: store.get().value.attachments },
          { reason: "history-key", event },
        ),
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
      const { value, disabled } = store.get();
      if (disabled || !value.attachments.some((item) => item.id === id)) return false;
      return change(
        "value",
        { ...value, attachments: value.attachments.filter((item) => item.id !== id) },
        event ? { reason: "remove-press", event } : { reason: "imperative" },
      );
    };
    const initialText = fromText(store.get().value.text);
    let returningFromStop = false;

    const readInput = () => {
      const segments = tokenInput.getValue();
      const { value } = store.get();
      const text = toText(segments);
      if (text === value.text) return;
      if (!change("value", { ...value, text, tokens: tokensOf(segments) }, { reason: "input-change" })) {
        tokenInput.setValue(fromText(value.text));
      }
    };
    const writeInput = () => {
      const { text } = store.get().value;
      if (toText(tokenInput.getValue()) !== text) tokenInput.setValue(fromText(text));
    };
    let disconnect: (() => void) | undefined;
    const connectInput = () => {
      // The controller reads undefined until a Token Input attaches it.
      if (!disconnect && tokenInput.getValue() !== undefined) {
        writeInput();
        const unlisten = tokenInput.editor.subscribe((edit) => {
          if (edit.type === "input") readInput();
        });
        const unsubscribe = store.subscribe(writeInput);
        disconnect = () => {
          unlisten();
          unsubscribe();
          disconnect = undefined;
        };
      }
      return () => disconnect?.();
    };

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
    const focusEditor = () => tokenInput.editor.element;
    const attachments = memo(
      (items: ComposerAttachment[], motion: MotionMode, disabled: boolean): ComposerAttachmentsState => ({
        items,
        motion,
        focusFallback: focusEditor,
        ...(!disabled && { onRemove: (id, details) => void removeAttachment(id, details.event) }),
      }),
    );

    // The draft as restored; any other draft means it was edited.
    let restoredDraft: ComposerDraft | undefined;
    const draftStore = () => {
      const { draftKey, draftStorage, value } = context.options();
      return draftKey !== undefined && draftStorage && value === undefined
        ? { key: draftKey, storage: draftStorage }
        : undefined;
    };
    const restore = () => {
      const saved = draftStore();
      const { value } = store.get();
      if (!saved || value.text !== "" || value.attachments.length > 0) return;
      const text = readSavedDraft(saved.storage, saved.key);
      if (text === undefined) return;
      // Tokens are part of the codec text, so they come back from it.
      const draft = { text, tokens: tokensOf(fromText(text)), attachments: [] };
      if (!change("value", draft, { reason: "restore" })) return;
      restoredDraft = store.get().value;
      store.set({ restored: true });
      announce("Draft restored", { priority: "polite" });
    };
    let bound = false;
    let { draftKey: lastKey, draftStorage: lastStorage } = context.options();
    // A web host sets `draftStorage` after the element is in the page, so a new storage restores too.
    context.onOptions(({ draftKey, draftStorage }) => {
      if (draftKey === lastKey && draftStorage === lastStorage) return;
      if (draftKey !== lastKey) {
        restoredDraft = undefined;
        if (store.get().restored) store.set({ restored: false });
      }
      lastKey = draftKey;
      lastStorage = draftStorage;
      if (bound) restore();
    });
    const bindDraft = () => {
      bound = true;
      restore();
      let last = store.get().value;
      const unsubscribe = store.subscribe(() => {
        const { value, restored } = store.get();
        if (value === last) return;
        last = value;
        if (restored && value !== restoredDraft) store.set({ restored: false });
        const saved = draftStore();
        if (saved) saveDraft(saved.storage, saved.key, value);
      });
      return () => {
        bound = false;
        unsubscribe();
      };
    };
    const discardRecovery = createFocusRecovery({ fallback: focusEditor });

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
      get discardDraft() {
        const { restored, disabled } = store.get();
        if (!restored || disabled) return undefined;
        return (event?: Event) => {
          if (
            !change(
              "value",
              emptyDraft(),
              event ? { reason: "discard-press", event } : { reason: "imperative" },
            )
          )
            return;
          const saved = draftStore();
          if (saved) saveDraft(saved.storage, saved.key, emptyDraft());
        };
      },
      bindDraft,
      tokenInput,
      intake,
      connectInput,
      history,
      recovery,
      discardRecovery,
      enterSubmit: (el) => {
        if (!returningFromStop) return;
        returningFromStop = false;
        void enter(el, "fade", { motion: store.get().motion });
      },
      bindAttachments: (el) => {
        const motion = () => ({ motion: store.get().motion });
        let filled = store.get().value.attachments.length > 0;
        let frame = 0;
        const unsubscribe = store.subscribe(() => {
          if (filled === store.get().value.attachments.length > 0) return;
          filled = !filled;
          cancelAnimationFrame(frame);
          if (filled) {
            if (store.get().attachmentsClosing) store.set({ attachmentsClosing: false });
            // By the next frame the first chip has rendered and filled in, so it measures; it plays before that
            // frame paints.
            frame = requestAnimationFrame(() => void enter(el, "expand", motion()));
            return;
          }
          store.set({ attachmentsClosing: true });
          exit(el, "expand", motion()).then(
            () => store.set({ attachmentsClosing: false }),
            // A chip arrived during the collapse.
            () => {},
          );
        });
        return () => {
          cancelAnimationFrame(frame);
          unsubscribe();
          cancel(el);
          if (store.get().attachmentsClosing) store.set({ attachmentsClosing: false });
        };
      },
      partState: {
        root: (state) => root(state.disabled, state.accept, state.maxSize),
        input: (state) => input(state.submitOn, state.disabled),
        triggerMenu: (state) => triggerMenu(state.mentions, state.commands),
        attachments: (state) => attachments(state.value.attachments, state.motion, state.disabled),
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
      bind: (el, { api }) => {
        const stopForwarding = forwardFileInputEvents(el, api.intake);
        const unbindDraft = api.bindDraft();
        return () => {
          stopForwarding();
          unbindDraft();
        };
      },
    }),
    // Wraps the Token Input and hears its keys bubble for ArrowUp history, as the skill's "wrap ours" seam does.
    input: slot<BaseSlotProps, ComposerInputState>({
      attrs: (state) => ({ "data-pending": state.pending ? "" : undefined }),
      state: (state, { api }) => api.partState.input(state),
      on: {
        keydown: (event, { api }) => {
          if (!event.defaultPrevented) api.history.keydown(event as KeyboardEvent);
        },
      },
      bind: (_el, { api }) => api.connectInput(),
    }),
    "trigger-menu": slot<BaseSlotProps, ComposerTriggerMenuState>({
      state: (state, { api }) => api.partState.triggerMenu(state),
    }),
    // Stays mounted while empty, so the first attachment plays its entrance like the rest.
    attachments: slot<BaseSlotProps, ComposerAttachmentsState>({
      attrs: (state) => ({
        "data-empty": state.value.attachments.length === 0 && !state.attachmentsClosing ? "" : undefined,
      }),
      state: (state, { api }) => api.partState.attachments(state),
      bind: (el, { api }) => api.bindAttachments(el),
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
      bind: (el, part) => {
        part.api.enterSubmit(el);
        return part.api.recovery.bind(el, part);
      },
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
    // Sits in the actions row's free middle, so neither its arrival nor its leaving moves the editor.
    restored: slot({
      role: "status",
      present: (state) => state.restored,
      attrs: (state) => ({ "data-motion": state.motion }),
    }),
    discard: slot({
      role: "button",
      focus: "native",
      present: (state) => state.restored,
      press: ({ api }, event) => api.discardDraft?.(event),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.disabled ? "true" : undefined,
      }),
      bind: (el, part) => part.api.discardRecovery.bind(el, part),
    }),
  }),
  agent: { actions: ["setValue", "insertToken", "removeAttachment", "submit", "stop", "discardDraft"] },
});
