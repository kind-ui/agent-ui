import {
  animateIn,
  animateOut,
  type ChangeDetails,
  createFocusRecovery,
  createStickToBottom,
  createVirtualizer,
  css,
  definePrimitive,
  dispatch,
  type FocusRecovery,
  type SlotDefinition,
  selects,
  type VirtualItem,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Approval, StepStatus } from "../../types/index.js";
import { type AnsiLine, type AnsiLines, type AnsiSpan, createAnsiLines } from "../ansi.js";
import { approvalMark, isActionable } from "../approval.js";
import {
  type ApprovalPartOptions,
  type ApprovalPartState,
  type ApprovalState,
  approvalPart,
} from "../approval-part.js";
import { createCopy } from "../clipboard.js";
import { memo } from "../memo.js";
import { resolveMotion } from "../motion/presets.js";
import { type StepApi, type StepOptions, type StepState, stepAnnouncement, stepBase } from "../step/base.js";
import { durationLabel } from "../time.js";
import { WORDS } from "../words.js";

/** What copied the output: the copy button, or a call to the api or an agent. */
export type TerminalCopyReason = "copy-press" | "imperative";

export type TerminalOptions = Omit<StepOptions, "status" | "label"> &
  Omit<ApprovalPartOptions, "approveLabel"> & {
    /**
     * The approve button's label.
     * @default "Run"
     */
    approveLabel?: string;
    /**
     * The command that ran, shown as the title. With a `label`, the label is the title and the command shows after a
     * prompt above the output.
     * @default ""
     */
    command?: string;
    /**
     * Everything the command printed so far, ANSI escapes included. Pass the whole output on each update: when it
     * continues the last one, only the new text is parsed.
     * @default ""
     */
    output?: string;
    /** The command's exit code, once it has finished. A code other than 0 shows as "Exit N" before the duration. */
    exitCode?: number;
    /**
     * A request to approve the command before it runs. While it waits, the title asks "Run <command>?" in full, the
     * meta reads "Waiting for approval" and the choices sit under it; once decided, the outcome takes their place and
     * the output grows below it.
     */
    approval?: Approval;
    /**
     * Defaults to `complete` for an `exitCode` of 0 and `error` for any other code. Without one: `awaiting-input`
     * while the approval waits on a decision, `cancelled` once it's denied, expired or cancelled, else `running`.
     */
    status?: StepStatus;
    /** Replaces the title, which is the command, and names the run in announcements. */
    label?: string;
    /** Called before the output is copied, without its escapes. Cancel it to copy something else yourself. */
    onCopy?: (output: string, details: ChangeDetails<TerminalCopyReason>) => void;
  };

export type TerminalState = StepState &
  ApprovalState & {
    /** The `label`, else the command. */
    title: string;
    /** The `command` option. */
    command: string;
    /** The `exitCode` option. */
    exitCode: number | undefined;
    /** The duration as "6 sec", or empty without `durationSeconds`. */
    duration: string;
    /** Whether the approval waits on a decision: the block can't close and the output doesn't show. */
    waiting: boolean;
    /** Whether the approval was denied, expired or cancelled, so the command never ran. */
    declined: boolean;
    /** The header's words: "Waiting for approval", nothing for a command that never ran, else the duration. */
    meta: string;
    /** Parses the output as it grows. */
    ansi: AnsiLines;
    /** The output's lines. While the output grows, only the last ones change. */
    lines: readonly AnsiLine[];
    /** Whether the output scrolls to new lines. Set by `createStickToBottom`; in the agent snapshot. */
    following: boolean;
    /** Whether Jump to latest is still animating out after following resumed. */
    jumpExiting: boolean;
    /** The lines to render, from `createVirtualizer`. */
    rows: readonly VirtualItem[];
    /** The height of every line together, in pixels. */
    size: number;
    /** Whether the output shows any text, so there's something to copy. */
    hasOutput: boolean;
    /** True for 2 s after the output is copied. */
    copied: boolean;
  };

/** The Confirmation the approval part renders. */
export type TerminalApprovalState = ApprovalPartState;

export type TerminalApi = StepApi & {
  /**
   * Copies the output without its escapes, and resolves with whether the clipboard write went through. Only while
   * there's output.
   */
  readonly copy: ((event?: Event) => Promise<boolean>) | undefined;
  /** Scrolls to the newest line and follows new output again. */
  scrollToEnd: () => void;
  /** Follows the viewport's end and picks the lines in view. Called by the viewport slot. */
  bindViewport: (el: HTMLElement) => () => void;
  /** Measures a rendered line. Called by the line slot. */
  measureLine: (index: number, el: HTMLElement) => () => void;
  /** Moves focus to the viewport when Jump to latest leaves with it. */
  recovery: FocusRecovery;
  /** Hands the approval part its Confirmation's props. Called by the approval slot. */
  approvalState: (state: TerminalState) => TerminalApprovalState;
  /** The title as pieces, odd ones code: "Run ", "npm test", "?" while the approval waits. Called by the title slot. */
  titleSpans: (state: TerminalState) => readonly string[];
};

// `value` keys the part, so each line's element is measured at its own index. React's `TerminalLine` sets it.
type LineProps = { index: number; value?: string };

type TerminalSlot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<TerminalState, TerminalApi, Props, Public>;

type TerminalSlots = {
  root: TerminalSlot;
  trigger: TerminalSlot;
  icon: TerminalSlot;
  title: TerminalSlot<BaseSlotProps, { title: string; spans: readonly string[] }>;
  exit: TerminalSlot<BaseSlotProps, { text: string }>;
  meta: TerminalSlot<BaseSlotProps, { duration: string; text: string }>;
  approval: TerminalSlot<BaseSlotProps, TerminalApprovalState>;
  content: TerminalSlot;
  command: TerminalSlot<BaseSlotProps, { command: string }>;
  copy: TerminalSlot;
  viewport: TerminalSlot;
  output: TerminalSlot<BaseSlotProps, { rows: readonly VirtualItem[] }>;
  line: TerminalSlot<LineProps & BaseSlotProps, { spans: readonly AnsiSpan[] }>;
  jump: TerminalSlot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type TerminalPrimitive = ReturnType<
  typeof definePrimitive<TerminalOptions, TerminalState, TerminalApi, TerminalSlots>
>;

// Waits on a person, or on the host to record their decision.
const waits = (approval: Approval | undefined) => isActionable(approval) || approval?.state === "submitting";

// Denied, expired or cancelled: the command never ran.
const declines = (approval: Approval | undefined) =>
  approval?.state === "expired" || approval?.state === "cancelled" || approval?.decision?.approved === false;

const base = stepBase<TerminalState, TerminalApi, TerminalOptions>({
  kind: "terminal",
  status: ({ exitCode, approval }) => {
    if (exitCode !== undefined) return exitCode === 0 ? "complete" : "error";
    if (waits(approval)) return "awaiting-input";
    return declines(approval) ? "cancelled" : "running";
  },
  announcement: (status, title, state) => {
    if (status === "error" && state.exitCode) return `${title} failed, exit code ${state.exitCode}`;
    // The Confirmation announces the decision itself.
    if (state.waiting || state.declined) return undefined;
    return stepAnnouncement(status, title);
  },
});

const question = (command: string) => (command ? `Run \`${command}\`?` : "Run this command?");

const presentation = (options: TerminalOptions) => {
  const { command = "", label, exitCode, durationSeconds, approval } = options;
  const waiting = waits(approval);
  const declined = declines(approval);
  const duration = durationLabel(durationSeconds);
  return {
    title: label ?? command,
    command,
    exitCode,
    duration,
    waiting,
    declined,
    meta: waiting ? WORDS.waiting : declined ? "" : duration,
    ...approvalPart.presentation(approval, options),
    // On a Terminal the approve verb is Run (Wave 7 spec §2.1).
    approveLabel: options.approveLabel ?? "Run",
  };
};

// No output while the command waits or never ran, unless the host passed some.
const showsOutput = (state: TerminalState) => state.hasOutput || !(state.waiting || state.declined);

const hasText = (lines: readonly AnsiLine[]) => lines.length > 1 || (lines[0]?.spans.length ?? 0) > 0;

// Until the viewport binds and the virtualizer measures, the first screenful of lines at a guessed height, so server
// markup shows the output and hydrating it moves nothing: 16 lines of 20px fill the default `--kind-terminal-max-height`.
const LINE_HEIGHT_GUESS = 20;
const firstRows = (lines: readonly AnsiLine[]): VirtualItem[] =>
  lines.slice(0, 16).map((_, index) => ({
    index,
    key: String(index),
    start: index * LINE_HEIGHT_GUESS,
    size: LINE_HEIGHT_GUESS,
  }));

const byIndex = ({ props }: { props: LineProps }) => [String(props.index)];

// A line hears only about its own entry and its own place, so a chunk reaches only the lines it changed.
const ownLine = selects<TerminalState, TerminalApi, LineProps>({
  // `createAnsiLines` keeps every line but the last ones while the output grows, and replaces them all when it
  // starts over, so the changed lines run from the end back to the first one kept.
  lines: {
    values: byIndex,
    moved: (before, after, notify) => {
      for (let i = Math.max(before.length, after.length) - 1; i >= 0 && before[i] !== after[i]; i--) {
        notify(String(i));
      }
    },
  },
  rows: {
    values: byIndex,
    moved: (before, after, notify) => {
      const starts = new Map(before.map((row) => [row.index, row.start]));
      for (const row of after) if (starts.get(row.index) !== row.start) notify(String(row.index));
    },
  },
  size: [],
  following: [],
  jumpExiting: [],
  hasOutput: [],
  copied: [],
});

// The parts around the output read neither the lines nor where they sit, so new output reaches only the output and
// line parts.
const outsideOutput = selects<TerminalState, TerminalApi, BaseSlotProps>({ lines: [], rows: [], size: [] });

export const terminalPrimitive: TerminalPrimitive = definePrimitive<
  TerminalOptions,
  TerminalState,
  TerminalApi,
  TerminalSlots
>({
  name: "kind-terminal",
  ...base,
  options: {
    ...base.options,
    ...approvalPart.options,
    command: "string",
    output: "value",
    exitCode: "number",
    approval: "value",
    onCopy: "callback",
  },
  state: (options) => {
    const ansi = createAnsiLines();
    const lines = ansi.update(options.output ?? "");
    return {
      ...base.state(options),
      ...presentation(options),
      ansi,
      lines,
      following: true,
      jumpExiting: false,
      rows: firstRows(lines),
      size: lines.length * LINE_HEIGHT_GUESS,
      hasOutput: hasText(lines),
      copied: false,
    };
  },
  // `output` reaches state through the parser in `api`, which keeps what it parsed before.
  sync: (options) => ({ ...base.sync(options), ...presentation(options) }),
  controlled: [...base.controlled, "following"],
  api: (context) => {
    const { store } = context;
    const copy = createCopy(context);
    // Read from the viewport as it binds, so a line that doesn't wrap measures what it was guessed at.
    let lineHeight = LINE_HEIGHT_GUESS;

    const stick = createStickToBottom({
      onChange: ({ following }) => {
        if (following === store.get().following) return;
        store.set({ following, ...(following && context.element("jump") ? { jumpExiting: true } : {}) });
      },
    });
    const virtual = createVirtualizer({
      count: () => store.get().lines.length,
      estimate: () => lineHeight,
    });
    virtual.subscribe(() => store.set({ rows: virtual.items(), size: virtual.size() }));

    context.onOptions((options) => {
      const { ansi, lines } = store.get();
      const next = ansi.update(options.output ?? "");
      if (next === lines) return;
      store.set({ lines: next, hasOutput: hasText(next) });
      // Fewer lines, or a new first line among several, means the output started over: its measured heights are stale.
      if (next.length < lines.length || (lines.length > 1 && next[0] !== lines[0])) virtual.reset();
      // The virtualizer lays out again once its count changes. Its scroll listener and ResizeObserver keep where the
      // viewport sits current, so `refresh()` reading the viewport again on every new line would only add layout reads.
      else if (next.length !== lines.length) store.set({ rows: virtual.items(), size: virtual.size() });
    });

    const step = base.api(context);
    // The same array while its pieces hold, so the title part renders only when its words change.
    const spans = memo((waiting: boolean, title: string, command: string): readonly string[] =>
      waiting && command ? ["Run ", command, "?"] : [waiting ? question(command) : title],
    );
    // The block can't close while its approval waits (Wave 7 spec §8).
    const holds = (open: boolean) => !open && store.get().open && store.get().waiting;

    return {
      ...step,
      setOpen: (open, cause) => !holds(open) && step.setOpen(open, cause),
      collapse: () => !holds(false) && step.collapse(),
      toggle: (event) => !holds(!store.get().open) && step.toggle(event),
      approvalState: approvalPart.approvalState<TerminalState>(context, {
        question: (state) => question(state.command),
      }),
      titleSpans: ({ waiting, title, command }) => spans(waiting, title, command),
      get copy() {
        if (!store.get().hasOutput) return undefined;
        return async (event?: Event) => {
          const text = store.get().ansi.text();
          const details = event
            ? { reason: "copy-press" as const, event }
            : { reason: "imperative" as const };
          if (dispatch(context, "onCopy", text, details)) return false;
          return copy(text);
        };
      },
      scrollToEnd: () => {
        const reduced =
          typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
        stick.scrollToBottom({
          behavior: resolveMotion(store.get().motion, reduced) === "full" ? "smooth" : "instant",
        });
      },
      bindViewport: (el) => {
        lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || lineHeight;
        const disconnectStick = stick.connect(el);
        const disconnectVirtual = virtual.connect(el);
        return () => {
          disconnectVirtual();
          disconnectStick();
        };
      },
      measureLine: (index, el) => virtual.measure(index, el),
      recovery: createFocusRecovery({ fallback: () => context.element("viewport") }),
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, meta, content } = base.slots(slot);
    return {
      root: slot({ ...root, selects: outsideOutput }),
      trigger: slot({
        ...trigger,
        selects: outsideOutput,
        attrs: (state, part) => ({
          ...trigger.attrs?.(state, part),
          "aria-disabled": state.waiting && state.open ? "true" : undefined,
        }),
      }),
      // A command that never ran says why: a slash when denied, a clock when expired (Wave 7 spec §2.1 Marks).
      icon: slot({
        ...icon,
        selects: outsideOutput,
        attrs: (state, part) => ({
          ...icon.attrs?.(state, part),
          "data-status":
            state.status === "cancelled" && state.declined ? approvalMark(state.approval) : state.status,
        }),
      }),
      title: slot<BaseSlotProps, { title: string; spans: readonly string[] }>({
        ...title,
        selects: outsideOutput,
        state: (state, { api }) => ({ title: state.title, spans: api.titleSpans(state) }),
        // The command is literal code, so only it is mono; a `label` or the question reads as words.
        attrs: (state, part) => ({
          ...title.attrs?.(state, part),
          "data-command": !state.waiting && state.title === state.command ? "" : undefined,
          "data-question": state.waiting ? "" : undefined,
        }),
      }),
      // The result is said once, in the header: "Exit 1 · 6 sec" (Wave 7 spec §20.5).
      exit: slot<BaseSlotProps, { text: string }>({
        selects: outsideOutput,
        present: (state) => state.exitCode !== undefined && state.exitCode !== 0,
        state: (state) => ({ text: `Exit ${state.exitCode}` }),
        attrs: () => ({ "data-exit": "failure" }),
      }),
      meta: slot<BaseSlotProps, { duration: string; text: string }>({
        ...meta,
        selects: outsideOutput,
        state: (state) => ({ duration: state.duration, text: state.meta }),
      }),
      // Under the header, outside the content, so a request shows while the step is closed and the outcome stays.
      approval: slot<BaseSlotProps, TerminalApprovalState>({
        ...approvalPart.slot<TerminalState, TerminalApi>(),
        selects: outsideOutput,
      }),
      content: slot({ ...content, selects: outsideOutput }),
      // The title is the command unless a `label` replaced it, so the command shows here only then.
      command: slot<BaseSlotProps, { command: string }>({
        selects: outsideOutput,
        present: (state) => state.command !== "" && state.title !== state.command,
        state: (state) => ({ command: state.command }),
      }),
      copy: slot({
        selects: outsideOutput,
        role: "button",
        focus: "native",
        present: (state) => state.hasOutput,
        press: ({ api }, event) => void api.copy?.(event),
        attrs: (state) => ({
          type: "button",
          "aria-label": "Copy output",
          "data-kind-icon-button": "",
          "data-kind-button": "secondary",
          "data-kind-size": "sm",
          "data-copied": state.copied ? "" : undefined,
        }),
      }),
      viewport: slot({
        selects: outsideOutput,
        present: showsOutput,
        role: "log",
        // A tab stop, so the keyboard can scroll it, as UI SDK Scroll Area's viewport is.
        focus: "tab-stop",
        attrs: (state) => ({
          tabindex: "0",
          "aria-label": state.title ? `${state.title} output` : "Output",
          // The run's outcome is announced; its lines aren't.
          "aria-live": "off",
          "data-following": state.following ? "" : undefined,
        }),
        bind: (el, { api }) => api.bindViewport(el),
      }),
      output: slot<BaseSlotProps, { rows: readonly VirtualItem[] }>({
        selects: selects<TerminalState, TerminalApi, BaseSlotProps>({ lines: [] }),
        state: (state) => ({ rows: state.rows }),
        attrs: (state) => ({ style: css({ "--kind-terminal-size": `${state.size}px` }) }),
      }),
      line: slot<LineProps, { spans: readonly AnsiSpan[] }>({
        props: { index: "number", value: "string" },
        selects: ownLine,
        state: (state, { props }) => ({ spans: state.lines[props.index]?.spans ?? [] }),
        attrs: (state, { props }) => {
          const start = state.rows.find((row) => row.index === props.index)?.start;
          return {
            // A line that ends gets a new object as the next one starts, so the line that was last hears it.
            "data-last": props.index === state.lines.length - 1 ? "" : undefined,
            style: css({ "--kind-terminal-line-start": start === undefined ? undefined : `${start}px` }),
          };
        },
        bind: (el, { api, props }) => api.measureLine(props.index, el),
      }),
      jump: slot({
        selects: outsideOutput,
        role: "button",
        focus: "native",
        press: ({ api }) => api.scrollToEnd(),
        present: (state) => !state.following || state.jumpExiting,
        attrs: (state) => ({ type: "button", "data-motion": state.motion }),
        // Enters and leaves through CSS on UI SDK's `data-starting-style` and `data-ending-style`.
        bind: (el, part) => {
          const { api, store } = part;
          let leaving = false;
          // Unbound as it starts leaving, while it still holds focus, so focus moves to the viewport before the
          // exit makes it inert.
          let unbindRecovery = api.recovery.bind(el, part);
          let stop = animateIn(el);
          const follow = () => {
            const { following } = store.get();
            if (following === leaving) return;
            leaving = following;
            stop();
            if (!leaving) {
              unbindRecovery = api.recovery.bind(el, part);
              stop = animateIn(el);
              return;
            }
            unbindRecovery();
            unbindRecovery = () => {};
            stop = animateOut(el, () => store.set({ jumpExiting: false }));
          };
          // It may bind while following resumed and it's still leaving, as when a web element is put back.
          follow();
          const unsubscribe = store.subscribe(follow);
          return () => {
            unsubscribe();
            stop();
            unbindRecovery();
          };
        },
      }),
    };
  },
  agent: { actions: ["expand", "collapse", "copy"] },
});
