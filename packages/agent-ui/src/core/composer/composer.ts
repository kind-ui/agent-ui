import {
  announce,
  type ChangeDetails,
  type ChangeSource,
  createChange,
  createFocusRecovery,
  createInputHistory,
  definePrimitive,
  matchesShortcut,
  type SlotDefinition,
  type ValueStorage,
} from "@ui-sdk/core";
import type { FileInputOptions, FileInputValueChangeReason } from "@ui-sdk/core/file-input";
import {
  createMenuController,
  type MenuActionDetails,
  type MenuController,
  type MenuOpenChangeReason,
} from "@ui-sdk/core/menu";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { ariaKeyshortcuts, formatShortcut } from "@ui-sdk/core/shortcuts";
import {
  createTokenInputController,
  fromText,
  type TokenInputController,
  type TokenInputOptions,
  type TokenInputValue,
  toText,
} from "@ui-sdk/core/token-input";
import type { TriggerDefinition } from "@ui-sdk/core/trigger-menu";
import { actionSource } from "../action-source.js";
import type { AttachmentsOptions } from "../attachments/index.js";
import { type ComposedHandler, hearComposed } from "../composed-events.js";
import { type FileIntake, forwardFileInputEvents } from "../file-input-events.js";
import { memo } from "../memo.js";
import { cancel, enter, exit, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { bindTextTarget, type TextInsertReason, takeBackText } from "../text-target.js";
import { WORDS } from "../words.js";
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
 * `"dictation"`: a Dictation inside the composer added its text. `"queue-edit"`: a docked Queue's Edit, Alt+Up or a
 * Message's Withdraw gave back a message that wasn't sent. `"imperative"`: an `api` call without an event.
 */
export type ComposerValueChangeReason =
  | "input-change"
  | "history-key"
  | FileInputValueChangeReason
  | "submit"
  | "restore"
  | "discard-press"
  | TextInsertReason;

/**
 * How a draft goes while a turn runs: `"steer"` into the turn at the agent's next step, `"queue"` after it ends, or
 * `"stop-and-send"`, which ends the turn and starts a new one with the draft.
 */
export type ComposerSteerMode = "steer" | "queue" | "stop-and-send";

/** `onSteer`'s details: the mode, what caused it and who. */
export type ComposerSteerDetails = {
  mode: ComposerSteerMode;
  reason: "send-press" | "send-key" | "item-press" | "imperative";
  event?: Event;
  source: ChangeSource;
};

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
  /**
   * Called when Stop is pressed. While it's set, Stop takes Send's place during a pending submission and while
   * `running`.
   */
  onStop?: () => void;
  /**
   * Whether the agent's turn is running. Stop shows while it is (with `onStop`), and Enter never sends a new turn:
   * with `onSteer`, a draft goes into the running turn instead.
   * @default false
   */
  running?: boolean;
  /**
   * Called with the draft when someone sends it while `running`, with `details.mode`: `"steer"` into the turn,
   * `"queue"` after it (add it to your Queue), or `"stop-and-send"` (stop the turn and send it as a new one). Return
   * a promise to lock sending until it settles: resolving clears what was sent, keeping anything typed since, and
   * rejecting keeps the draft. While it's set and a turn runs, Send shows beside Stop once there's text.
   */
  onSteer?: (draft: ComposerDraft, details: ComposerSteerDetails) => unknown;
  /**
   * What Send and Enter do while `running`. The other mode is in Send's menu and on Alt+Enter.
   * @default "steer"
   */
  steerMode?: "steer" | "queue";
  /**
   * Offers Stop and send in Send's menu, and on Shift+Mod+Enter.
   * @default true when `onStop` and `onSteer` are set
   */
  stopAndSend?: boolean;
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
  /** Whether `onStop` is set, so Stop takes Send's place while pending or running. */
  canStop: boolean;
  /** The `running` option. */
  running: boolean;
  /** Whether `running` and `onSteer` are both set, so Send shows beside Stop once there's text. */
  canSteer: boolean;
  /** The `steerMode` option. */
  steerMode: "steer" | "queue";
  /** Whether Stop and send is offered. */
  stopAndSend: boolean;
  /** Whether a pending submission carries attachments, so Stop reads "Cancel sending". */
  uploading: boolean;
  /** Whether a steer, queue or stop-and-send is in flight; sending is locked until it settles. */
  steerPending: boolean;
  /** Whether Send's menu is open. */
  sendMenuOpen: boolean;
  /** The keys of each way to send, in the platform's symbols; `null` on the server and until the root binds. */
  keys: ComposerKeys | null;
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
  /**
   * Adds text at the end of the draft, after a space, as a Dictation inside the composer does with what it heard.
   * `source`, `"programmatic"` by default, is who caused it, as the change's details report. With `"queue-edit"`, as
   * a docked Queue's Edit gives a message back, the text goes on its own line and the caret after it. Returns whether
   * the change was accepted.
   */
  appendText: (text: string, source?: ChangeSource, reason?: TextInsertReason) => boolean;
  /** Inserts a mention or command at the caret. Returns whether it was inserted. */
  insertToken: (token: TokenToInsert) => boolean;
  /** Removes an attachment from the draft by its `id`. Returns whether the change was accepted. */
  removeAttachment: (id: string, event?: Event) => boolean;
  /** Sends the draft, unless there's nothing to send, it's pending or disabled, or `onSubmit` isn't set. */
  submit: (event?: Event) => void;
  /** Calls `onStop`. Offered only while a submission is pending or a turn is running, and `onStop` is set. */
  readonly stop: ((event?: Event) => void) | undefined;
  /**
   * Sends the draft into the running turn through `onSteer`. Offered only while `running` and `onSteer` are set,
   * nothing is in flight, and there's something to send.
   */
  readonly steer: ((event?: Event) => void) | undefined;
  /** Sends the draft after the running turn, through `onSteer`. Offered when `steer` is. */
  readonly queue: ((event?: Event) => void) | undefined;
  /** Stops the turn and sends the draft as a new one, through `onSteer`. Offered when `steer` is and `stopAndSend` is on. */
  readonly stopAndSend: ((event?: Event) => void) | undefined;
  /** Sends as Enter does: in `steerMode` while a turn runs and `onSteer` is set, else through `onSubmit`. */
  sendDraft: (event?: Event) => void;
  /** Handles Alt+Enter, Shift+Mod+Enter and Alt+Up in the editor. Returns whether it took the key. */
  sendKeydown: (event: KeyboardEvent) => boolean;
  /** Drives Send's menu. */
  sendMenu: MenuController;
  /** Send's menu's events on Web Components, heard by the send-menu slot through `hearComposed`. */
  sendMenuEvents: Record<string, ComposedHandler>;
  /** Empties a restored draft and removes it from `draftStorage`. Offered only while "Draft restored" shows. */
  readonly discardDraft: ((event?: Event) => void) | undefined;
  /** Restores the saved draft and keeps saving it while the root is in the page. Returns a cleanup. */
  bindDraft: () => () => void;
  /** Drives the Token Input; render layers pass it as its `controller`. */
  tokenInput: TokenInputController;
  /** Takes in what File Input accepted or rejected. */
  intake: FileIntake;
  /**
   * Starts syncing the draft and the Token Input once the Token Input has attached the controller, which can happen
   * after the input part binds (web, and Vue, whose template ref binds before the nested Token Input mounts); the input
   * part tries again a microtask after it binds. Returns a cleanup; calling it again while connected does nothing.
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
    steer: (state: ComposerState) => ComposerSteerState;
    sendMenu: (state: ComposerState) => ComposerSendMenuState;
    sendMenuTrigger: (state: ComposerState) => ComposerSendMenuTriggerState;
  };
};

/** The keys of each way to send, as `formatShortcut` shows them, and for `aria-keyshortcuts`. */
export type ComposerKeys = Record<ComposerSteerMode, { label: string; aria: string }>;

/** What the steer slot hands render functions: Send's words while a turn runs. */
export type ComposerSteerState = { label: string };

/** A row of Send's menu: a way to send, its words, its keys, and whether it's `steerMode`. */
export type ComposerSendItem = {
  value: ComposerSteerMode;
  label: string;
  description: string;
  shortcut: string;
  checked: boolean;
};

/** What the send-menu slot hands UI SDK Menu, and its rows. On Web Components, write the Menu's keys onto the `ui-menu`. */
export type ComposerSendMenuState = {
  controller: MenuController;
  open: boolean;
  onOpenChange: (open: boolean, details: ChangeDetails<MenuOpenChangeReason>) => void;
  onAction: (value: string, details: MenuActionDetails) => void;
  items: ComposerSendItem[];
};

/** What the send-menu-trigger slot hands UI SDK's `MenuTrigger`. */
export type ComposerSendMenuTriggerState = { "aria-label": string; disabled: boolean };

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
      steer: ComposerSlot<ComposerSteerState>;
      "send-menu": ComposerSlot<ComposerSendMenuState>;
      "send-menu-trigger": ComposerSlot<ComposerSendMenuTriggerState>;
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

const presentation = (options: ComposerOptions) => {
  const running = options.running ?? false;
  return {
    canStop: options.onStop !== undefined,
    running,
    canSteer: running && options.onSteer !== undefined,
    steerMode: options.steerMode === "queue" ? ("queue" as const) : ("steer" as const),
    stopAndSend: options.stopAndSend ?? (options.onStop !== undefined && options.onSteer !== undefined),
    disabled: options.disabled ?? false,
    submitOn: options.submitOn ?? "enter",
    agentConfirm: options.agentConfirm ?? true,
    mentions: options.mentions,
    commands: options.commands,
    accept: options.accept,
    maxSize: options.maxSize,
    motion: options.motion ?? "auto",
  };
};

/** The keys that send in each mode: `steerMode` on Enter (Mod+Enter under `"mod-enter"`), the other on Alt+Enter. */
const sendShortcuts = (submitOn: ComposerState["submitOn"], mode: ComposerState["steerMode"]) => {
  const primary = submitOn === "mod-enter" ? "mod+Enter" : "Enter";
  return {
    steer: mode === "steer" ? primary : "alt+Enter",
    queue: mode === "queue" ? primary : "alt+Enter",
    "stop-and-send": "shift+mod+Enter",
  } satisfies Record<ComposerSteerMode, string>;
};

const keysOf = (submitOn: ComposerState["submitOn"], mode: ComposerState["steerMode"]): ComposerKeys => {
  const shortcuts = sendShortcuts(submitOn, mode);
  // The Return symbol reads as an arrow, or as an emoji in some fonts, so the key is spelled out: "⌥ Enter".
  const keys = (shortcut: string) => ({
    label: formatShortcut(shortcut)
      .replace(/(?<=[\u2325\u21e7\u2318\u2303])[\u21a9\u23ce]/u, " Enter")
      .replace(/[\u21a9\u23ce]/u, "Enter"),
    aria: ariaKeyshortcuts(shortcut),
  });
  return {
    steer: keys(shortcuts.steer),
    queue: keys(shortcuts.queue),
    "stop-and-send": keys(shortcuts["stop-and-send"]),
  };
};

/** Whether Send shows beside Stop: a turn runs, `onSteer` is set and there's something to send. */
const showsSend = (state: ComposerState) => state.canSteer && isSubmittable(state.value);

export const composerPrimitive: ComposerPrimitive = definePrimitive({
  name: "kind-composer",
  options: {
    value: "value",
    defaultValue: "value",
    onValueChange: "callback",
    onSubmit: "action",
    onStop: "callback",
    running: "boolean",
    onSteer: "action",
    steerMode: "string",
    stopAndSend: "boolean",
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
      uploading: false,
      steerPending: false,
      sendMenuOpen: false,
      keys: null,
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
    const controller = createTokenInputController();
    const tokenInput = controller;
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

    // Text appended after its cause ended, like a dictation's source finishing, reports who caused it.
    let appendSource: ChangeSource = "programmatic";
    const appended = createChange(context, () => appendSource);
    const appendText = (
      text: string,
      source: ChangeSource = "programmatic",
      reason: TextInsertReason = "dictation",
    ) => {
      const { value, disabled } = store.get();
      const words = text.trim();
      if (disabled || !words) return false;
      const joiner = reason === "queue-edit" ? "\n" : " ";
      const joined = value.text.trim() ? `${value.text.trimEnd()}${joiner}${words}` : words;
      appendSource = source;
      const changed = appended(
        "value",
        { ...value, text: joined, tokens: tokensOf(fromText(joined)) },
        { reason },
      );
      if (changed && reason === "queue-edit") controller.focus({ at: "end" });
      return changed;
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
      store.set({ pending: false, uploading: false });
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
      fallback: () =>
        context.element("steer") ??
        context.element("stop") ??
        context.element("submit") ??
        tokenInput.editor.element,
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
      // A Token Input that moved to another composer has left this controller, though its edits still reach us.
      if (segments === undefined) return;
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
    // The key the draft on screen belongs to: text kept through a `draftKey` change stays its old conversation's.
    let owner: string | undefined;
    // A storage that arrives late (a web property, a React host's new object) restores only before this.
    let touched = false;
    const storageOf = (): ValueStorage | undefined => {
      const { draftStorage, value } = context.options();
      return value === undefined ? draftStorage : undefined;
    };
    const isEmpty = (draft: ComposerDraft) => draft.text === "" && draft.attachments.length === 0;
    const restore = () => {
      const { draftKey } = context.options();
      const storage = storageOf();
      if (draftKey === undefined || !storage || !isEmpty(store.get().value)) return;
      owner = draftKey;
      const text = readSavedDraft(storage, draftKey);
      if (text === undefined) return;
      // Tokens are part of the codec text, so they come back from it.
      const draft = { text, tokens: tokensOf(fromText(text)), attachments: [] };
      if (!change("value", draft, { reason: "restore" })) return;
      touched = true;
      restoredDraft = store.get().value;
      store.set({ restored: true });
      announce("Draft restored", { priority: "polite" });
    };
    let bound = false;
    let { draftKey: lastKey, draftStorage: lastStorage } = context.options();
    context.onOptions(({ draftKey, draftStorage }) => {
      const keyChanged = draftKey !== lastKey;
      const storageArrived = draftStorage !== lastStorage && !touched;
      lastKey = draftKey;
      lastStorage = draftStorage;
      if (keyChanged) {
        restoredDraft = undefined;
        if (store.get().restored) store.set({ restored: false });
      }
      if (bound && (keyChanged || storageArrived)) restore();
    });
    const bindDraft = () => {
      bound = true;
      owner = context.options().draftKey;
      restore();
      let last = store.get().value;
      const unsubscribe = store.subscribe(() => {
        const { value, restored } = store.get();
        if (value === last) return;
        last = value;
        touched = true;
        if (restored && value !== restoredDraft) store.set({ restored: false });
        const storage = storageOf();
        if (storage && owner !== undefined) saveDraft(storage, owner, value);
        // Once the old conversation's text is sent or cleared, the current key's draft comes back.
        if (isEmpty(value) && owner !== context.options().draftKey) restore();
      });
      return () => {
        bound = false;
        unsubscribe();
      };
    };
    const discardRecovery = createFocusRecovery({ fallback: focusEditor });

    const submit = () => {
      const { onSubmit } = context.options();
      const { value, pending, steerPending, running, disabled } = store.get();
      // Enter never starts a new turn while one runs, and one lock covers every way to send.
      if (disabled || pending || steerPending || running || !onSubmit || !isSubmittable(value)) return;
      history.reset();
      const submission = onSubmit(value);
      if (!isThenable(submission)) return settle(value, "resolved");
      store.set({ pending: true, uploading: value.attachments.length > 0 });
      announce("Sending", { priority: "polite" });
      submission.then(
        () => settle(value, "resolved"),
        () => settle(value, "rejected"),
      );
    };

    // A resolved send clears what it sent and keeps what was typed after it, past a space or a line break; a draft
    // edited in any other way stays whole, as the submit contract keeps it.
    const afterSend = (current: ComposerDraft, sent: ComposerDraft): ComposerDraft => {
      const rest = current.text.startsWith(sent.text) ? current.text.slice(sent.text.length) : undefined;
      const text = rest !== undefined && (rest === "" || /^\s/.test(rest)) ? rest.trimStart() : current.text;
      const sentIds = new Set(sent.attachments.map((item) => item.id));
      const attachments = current.attachments.filter((item) => !sentIds.has(item.id));
      if (text === current.text && attachments.length === current.attachments.length) return current;
      return { text, tokens: tokensOf(fromText(text)), attachments };
    };
    const steering = createPendingAction(context, { state: "steerPending" });
    const canSend = () => {
      const { canSteer, disabled, pending, steerPending, value } = store.get();
      return canSteer && !disabled && !pending && !steerPending && isSubmittable(value);
    };
    const SENT: Record<ComposerSteerMode, string> = {
      steer: WORDS.steerSent,
      queue: WORDS.queued,
      "stop-and-send": WORDS.stoppedAndSent,
    };
    const runSteer = (
      mode: ComposerSteerMode,
      event: Event | undefined,
      reason: ComposerSteerDetails["reason"],
    ) => {
      const { onSteer } = context.options();
      if (!onSteer || !canSend() || (mode === "stop-and-send" && !store.get().stopAndSend)) return;
      const sent = store.get().value;
      const details: ComposerSteerDetails = {
        mode,
        reason,
        ...(event && { event }),
        source: actionSource(event, reason),
      };
      history.reset();
      void steering
        .run(() => onSteer(sent, details))
        ?.then((outcome) => {
          if (outcome === "stale") return;
          if (outcome === "failed") return announce("Message not sent", { priority: "polite" });
          announce(SENT[mode], { priority: "polite" });
          const current = store.get().value;
          const next = afterSend(current, sent);
          if (next !== current) change("value", next, { reason: "submit" });
        });
    };
    const offered = (mode: ComposerSteerMode) =>
      canSend() && (mode !== "stop-and-send" || store.get().stopAndSend)
        ? (event?: Event) => runSteer(mode, event, event ? "send-press" : "imperative")
        : undefined;
    const otherMode = (mode: ComposerState["steerMode"]) => (mode === "steer" ? "queue" : "steer");

    const sendMenu = createMenuController();
    const onSendMenuOpenChange = (open: boolean) => store.set({ sendMenuOpen: open });
    const onSendAction = (value: string, { event }: MenuActionDetails) => {
      if (value === "steer" || value === "queue" || value === "stop-and-send")
        runSteer(value, event, "item-press");
    };
    const ROWS: Record<ComposerSteerMode, Pick<ComposerSendItem, "label" | "description">> = {
      steer: { label: WORDS.steerNow, description: WORDS.steerHint },
      queue: { label: WORDS.queueForLater, description: WORDS.queueHint },
      "stop-and-send": { label: WORDS.stopAndSend, description: WORDS.stopAndSendHint },
    };
    const sendMenuState = memo(
      (
        mode: ComposerState["steerMode"],
        stopAndSend: boolean,
        keys: ComposerKeys | null,
        open: boolean,
      ): ComposerSendMenuState => {
        const modes: ComposerSteerMode[] = [
          "steer",
          "queue",
          ...(stopAndSend ? (["stop-and-send"] as const) : []),
        ];
        return {
          controller: sendMenu,
          open,
          onOpenChange: onSendMenuOpenChange,
          onAction: onSendAction,
          items: modes.map((value) => ({
            value,
            ...ROWS[value],
            shortcut: keys?.[value].label ?? "",
            checked: value === mode,
          })),
        };
      },
    );
    const steerState = memo(
      (mode: ComposerState["steerMode"]): ComposerSteerState => ({
        label: mode === "steer" ? WORDS.steer : "Queue",
      }),
    );
    const sendMenuTriggerState = memo(
      (disabled: boolean): ComposerSendMenuTriggerState => ({ "aria-label": WORDS.moreWaysToSend, disabled }),
    );
    const sendMenuEvents: Record<string, ComposedHandler> = {
      openchange: (detail, event) => {
        if ((event.target as Element).localName === "ui-menu")
          onSendMenuOpenChange((detail as { value: boolean }).value);
      },
      action: (detail, event) => {
        if ((event.target as Element).localName !== "ui-menu") return;
        const { value, event: cause } = detail as { value: string; event?: Event };
        onSendAction(value, cause ? { event: cause } : {});
      },
    };
    // Send comes back from Stop once the turn ends, and the menu closes once Send leaves.
    let { running: wasRunning } = store.get();
    context.onOptions(() => {
      const { running, canStop, steerMode, submitOn, keys } = store.get();
      if (wasRunning && !running && canStop) returningFromStop = true;
      wasRunning = running;
      if (keys) store.set({ keys: keysOf(submitOn, steerMode) });
    });
    context.onDestroy(
      store.subscribe(() => {
        const state = store.get();
        if (state.sendMenuOpen && !showsSend(state)) sendMenu.close();
      }),
    );

    const sendKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return false;
      const { canSteer, steerMode, value, disabled } = store.get();
      if (matchesShortcut(event, "alt+ArrowUp")) {
        const root = context.element("root");
        if (disabled || !root || isSubmittable(value) || !takeBackText(root, "keyboard")) return false;
        event.preventDefault();
        return true;
      }
      if (!canSteer) return false;
      const mode = matchesShortcut(event, "shift+mod+Enter")
        ? "stop-and-send"
        : matchesShortcut(event, "alt+Enter") ||
            (store.get().submitOn === "enter" && matchesShortcut(event, "mod+Enter"))
          ? otherMode(steerMode)
          : undefined;
      if (!mode) return false;
      // Never a new line while a turn runs, even when there's nothing to send.
      event.preventDefault();
      runSteer(mode, event, "send-key");
      return true;
    };

    return {
      getValue: () => store.get().value,
      setValue,
      appendText,
      insertToken: ({ kind, value, label }) => tokenInput.insert({ type: kind, value, label }) === true,
      removeAttachment,
      submit,
      get stop() {
        const { pending, running } = store.get();
        const { onStop } = context.options();
        return (pending || running) && onStop ? () => onStop() : undefined;
      },
      get steer() {
        return offered("steer");
      },
      get queue() {
        return offered("queue");
      },
      get stopAndSend() {
        return offered("stop-and-send");
      },
      sendDraft: (event) => {
        const { canSteer, steerMode } = store.get();
        if (!canSteer) return submit();
        runSteer(steerMode, event, event?.type === "submit" ? "send-key" : "send-press");
      },
      sendKeydown,
      sendMenu,
      sendMenuEvents,
      get discardDraft() {
        const { restored, disabled } = store.get();
        if (!restored || disabled) return undefined;
        // Saving an empty draft removes it from storage.
        return (event?: Event) =>
          void change(
            "value",
            emptyDraft(),
            event ? { reason: "discard-press", event } : { reason: "imperative" },
          );
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
        steer: (state) => steerState(state.steerMode),
        sendMenu: (state) =>
          sendMenuState(state.steerMode, state.stopAndSend, state.keys, state.sendMenuOpen),
        sendMenuTrigger: (state) =>
          sendMenuTriggerState(state.disabled || state.pending || state.steerPending),
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
          api.sendDraft(event);
        },
      },
      bind: (el, { api, store }) => {
        const stopForwarding = forwardFileInputEvents(el, api.intake);
        const unbindDraft = api.bindDraft();
        const text = bindTextTarget(
          el,
          api.appendText,
          () => store.get().running,
          () => !store.get().disabled,
        );
        // Key labels depend on the platform, so they're written once the page has hydrated.
        const { submitOn, steerMode } = store.get();
        store.set({ keys: keysOf(submitOn, steerMode) });
        let { running } = store.get();
        const unsubscribe = store.subscribe(() => {
          if (store.get().running === running) return;
          running = store.get().running;
          text.update();
        });
        return () => {
          stopForwarding();
          unbindDraft();
          unsubscribe();
          text.cleanup();
        };
      },
    }),
    // Wraps the Token Input and hears its keys bubble for ArrowUp history, as the skill's "wrap ours" seam does.
    input: slot<BaseSlotProps, ComposerInputState>({
      attrs: (state) => ({ "data-pending": state.pending ? "" : undefined }),
      state: (state, { api }) => api.partState.input(state),
      on: {
        keydown: (event, { api }) => {
          const press = event as KeyboardEvent;
          if (!api.sendKeydown(press) && !press.defaultPrevented) api.history.keydown(press);
        },
      },
      bind: (_el, { api }) => {
        // Vue binds a part before the Token Input nested in it attaches the controller, so try again a microtask later.
        let bound = true;
        const disconnect = api.connectInput();
        queueMicrotask(() => {
          if (bound) api.connectInput();
        });
        return () => {
          bound = false;
          disconnect();
        };
      },
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
      present: (state) => !state.running && !(state.pending && state.canStop),
      press: ({ api }, event) => api.submit(event),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Send",
        "aria-disabled":
          state.pending || state.steerPending || state.disabled || !isSubmittable(state.value)
            ? "true"
            : undefined,
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
    steer: slot<BaseSlotProps, ComposerSteerState>({
      role: "button",
      focus: "native",
      present: showsSend,
      press: ({ api }, event) => api.sendDraft(event),
      state: (state, { api }) => api.partState.steer(state),
      attrs: (state) => {
        const keys = state.keys?.[state.steerMode];
        const hint = state.steerMode === "steer" ? WORDS.steerTooltip : WORDS.queueHint;
        return {
          type: "button",
          title: keys ? `${hint} · ${keys.label}` : hint,
          "aria-keyshortcuts": keys?.aria,
          "aria-disabled": state.pending || state.steerPending || state.disabled ? "true" : undefined,
          "aria-busy": state.steerPending ? "true" : undefined,
          "data-pending": state.steerPending ? "" : undefined,
          "data-steer-mode": state.steerMode,
          "data-motion": state.motion,
        };
      },
      on: { mousedown: (event) => event.preventDefault() },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    // Wraps UI SDK Menu, which holds Send, its chevron and the other ways to send; on Web Components it hears the
    // menu's events.
    "send-menu": slot<BaseSlotProps, ComposerSendMenuState>({
      present: showsSend,
      state: (state, { api }) => api.partState.sendMenu(state),
      attrs: (state) => ({ "data-open": state.sendMenuOpen ? "" : undefined, "data-motion": state.motion }),
      bind: (el, { api }) => hearComposed(el, api.sendMenuEvents),
    }),
    // Wraps UI SDK's `MenuTrigger`, which agents don't see: `steer`, `queue` and `stopAndSend` are its actions.
    "send-menu-trigger": slot<BaseSlotProps, ComposerSendMenuTriggerState>({
      present: showsSend,
      state: (state, { api }) => api.partState.sendMenuTrigger(state),
    }),
    stop: slot({
      role: "button",
      focus: "native",
      present: (state) => (state.pending || state.running) && state.canStop,
      press: ({ api }, event) => api.stop?.(event),
      attrs: (state) => ({
        type: "button",
        // A submission still uploading its files can be cancelled; past that, Stop ends the reply.
        "aria-label": !state.running && state.uploading ? WORDS.cancelSending : WORDS.stopGenerating,
        // Send is the one primary while it shows, so Stop turns quiet.
        "data-quiet": showsSend(state) ? "" : undefined,
        "data-motion": state.motion,
      }),
      on: { mousedown: (event) => event.preventDefault() },
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
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
        "data-kind-button": "",
      }),
      bind: (el, part) => part.api.discardRecovery.bind(el, part),
    }),
  }),
  agent: {
    actions: [
      "setValue",
      "insertToken",
      "removeAttachment",
      "submit",
      "steer",
      "queue",
      "stopAndSend",
      "stop",
      "discardDraft",
    ],
  },
});
