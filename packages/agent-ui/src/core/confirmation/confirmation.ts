import {
  type ActionDetails,
  announce,
  createFocusRecovery,
  definePrimitive,
  type SlotDefinition,
  sourceOf,
} from "@ui-sdk/core";
import { createInputController, type InputController } from "@ui-sdk/core/input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { Approval } from "../../types/index.js";
import { actionSource } from "../action-source.js";
import { approvalKey, approvalLabel, approvalMark, isActionable, isSettled } from "../approval.js";
import { countdownText, createCountdown } from "../countdown.js";
import { memo } from "../memo.js";
import { cancel, enter, exit, type MotionMode } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { plainText, WORDS } from "../words.js";

/** What a decision answers: the request generation it was made for, and Deny's reason. */
export interface ConfirmationDecision {
  approvalId: string;
  generation: number;
  /** The reason box's text, or what an agent passed to `deny`. Only on a denial, and only when not empty. */
  reason?: string;
  /** Set by Always allow: approve, and remember the choice. The host keeps the allow list. */
  always?: true;
  /** Always allow's `alwaysScope`, where the choice reaches, like "in this project". */
  scope?: string;
}

/** A choice a person can press. */
export type ConfirmationChoice = "approve" | "always" | "deny";

/**
 * Called with the decision. Return a promise to keep the choices disabled until it settles: a rejection makes them
 * available again. `details.source` says who decided, like `"mouse"`, `"keyboard"` or `"agent"`.
 */
export type ConfirmationCallback = (decision: ConfirmationDecision, details: ActionDetails) => unknown;

export type ConfirmationOptions = {
  /** The request, from the host. A new `generation` replaces it, and a result for the old one is ignored. */
  approval?: Approval;
  /**
   * Names the confirmation, like "Allow `search_docs`?", and shows it as its title, text in backticks as code. Inside
   * a Tool the title is hidden, since the Tool names the request.
   * @default "Approval request"
   */
  label?: string;
  /** Called when the request is approved. Shows Approve while set. */
  onApprove?: ConfirmationCallback;
  /** Called when the request is denied. Shows Deny while set. */
  onDeny?: ConfirmationCallback;
  /**
   * Called when a person approves and asks not to be asked again, with `always: true` and `alwaysScope` as `scope` in
   * the decision. Shows Always allow, between Deny and Approve, while set and `risk` isn't `"danger"`. The host keeps
   * the allow list and its revocation.
   */
  onAlwaysAllow?: ConfirmationCallback;
  /**
   * Asks for the reason Deny sends, while `onDeny` is set: a person's first Deny opens a box for it above the
   * choices, and Deny then sends it. It keeps its text through a new `generation` of the same request, and empties
   * for a new `approvalId`.
   * @default false
   */
  reason?: boolean;
  /** @default "Approve" */
  approveLabel?: string;
  /** @default "Deny" */
  denyLabel?: string;
  /** @default "Always allow" */
  alwaysLabel?: string;
  /** What Always allow covers, like "search_docs", shown as code after its label and in the outcome. */
  alwaysTarget?: string;
  /**
   * Where Always allow reaches, like "in this project" or "in this session", added to its name and to the outcome
   * ("Always allowed `search_docs` in this project"). Use the same words in `alwaysDetail`.
   */
  alwaysScope?: string;
  /**
   * A line under the choices while Always allow shows, saying what it covers, like "Covers `search_docs` in this
   * project.". Text in backticks shows as code.
   */
  alwaysDetail?: string;
  /** `"danger"` makes Approve a danger button and leaves out Always allow. */
  risk?: "danger";
  /** What could go wrong, shown above the choices after a warning mark, like "Changes how releases publish.". */
  riskText?: string;
  /** Where focus goes when a choice leaves while focused, like a tool's trigger. Defaults to the outcome. */
  focusFallback?: () => HTMLElement | null | undefined;
  /**
   * How the choices and the outcome fade in when they swap. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ConfirmationState = {
  /** The `label` without its backticks, else "Approval request". */
  label: string;
  /** The `label` the host passed, shown as the title. */
  title: string | undefined;
  /** The request's state, or `undefined` without one. */
  approvalState: Approval["state"] | undefined;
  /** The request's `approvalKey`, empty without one. */
  key: string;
  /** Whether a person can decide: the request is `requested` or `submit-failed`. */
  actionable: boolean;
  /** The recorded decision, `undefined` before there is one. */
  approved: boolean | undefined;
  /** Where the request stands, in words, code in backticks, from `approvalLabel`. */
  outcome: string | undefined;
  /** The recorded decision's reason. */
  outcomeReason: string | undefined;
  /** The outcome's status mark: `complete`, `denied`, `expired`, `cancelled` and the pending ones. */
  outcomeMark: string | undefined;
  /** The approval's `expiresAt`. */
  expiresAt: string | undefined;
  /** Seconds until `expiresAt`, in whole minutes while a minute or more is left; `null` before it counts. Live. */
  deadline: number | null;
  /** Whether a promise a callback returned is still pending. */
  pending: boolean;
  /** Whether a decision was sent and the host hasn't reported on it yet, so the choices stay disabled. */
  sent: boolean;
  /** The choice that was pressed, while its decision is pending or sent. */
  pressed: ConfirmationChoice | undefined;
  /** Whether `onApprove` is set. */
  canApprove: boolean;
  /** Whether `onDeny` is set. */
  canDeny: boolean;
  /** Whether Always allow shows: `onAlwaysAllow` is set and `risk` isn't `"danger"`. */
  canAlwaysAllow: boolean;
  /** Always allow's label and target, code in backticks: "Always allow `search_docs`". */
  alwaysLabel: string;
  /** Always allow's name: its label and `alwaysScope`. */
  alwaysName: string;
  /** The `alwaysDetail` option. */
  alwaysDetail: string | undefined;
  /** The `risk` option. */
  risk: "danger" | undefined;
  /** The `riskText` option. */
  riskText: string | undefined;
  /** The `reason` option. */
  reason: boolean;
  /** The reason box's text. */
  reasonText: string;
  /** Whether a person opened the reason box with Deny. */
  composing: boolean;
  /** Whether the choices don't fit one row, so Always allow takes its own row above Deny and Approve. */
  stacked: boolean;
  /** Whether the reason box is collapsing after a decision was recorded. */
  reasonClosing: boolean;
  /** The `approveLabel`, else "Approve". */
  approveLabel: string;
  /** The `denyLabel`, else "Deny". */
  denyLabel: string;
  /** The `motion` option. */
  motion: MotionMode;
};

export type ConfirmationReasonState = {
  /** Pass it to the Textarea as its `controller`, so an agent's reason fills it. */
  controller: InputController;
  /** True while the request can't be decided or a decision is in flight. */
  readOnly: boolean;
};

export type ConfirmationApi = {
  /** Calls `onApprove`. Offered only while it's set, the request is actionable and no decision is in flight. */
  readonly approve: (() => void) | undefined;
  /** Calls `onAlwaysAllow`. Offered only while Always allow shows, the request is actionable and nothing's in flight. */
  readonly alwaysAllow: (() => void) | undefined;
  /**
   * Calls `onDeny` with `reason`, which also fills the reason box, else with the box's text. Offered only while
   * it's set, the request is actionable and no decision is in flight.
   */
  readonly deny: ((reason?: string) => void) | undefined;
  /**
   * Decides as a press does. Called by the approve, always and deny slots. With `reason`, Deny first opens the reason
   * box, and decides once it's open.
   */
  press: (choice: ConfirmationChoice, event?: Event) => void;
  /** Closes the reason box without deciding. Called by the cancel slot. */
  cancelReason: () => void;
  /** Hands the reason box its props. Called by the reason slot. */
  reasonState: (state: ConfirmationState) => ConfirmationReasonState;
  /** Moves focus to `focusFallback`, else the outcome, when a choice leaves while focused. */
  recovery: ReturnType<typeof createFocusRecovery>;
  /** Moves focus to Deny when Cancel leaves while focused. */
  cancelRecovery: ReturnType<typeof createFocusRecovery>;
  /** Measures whether the choices fit one row, setting `stacked`. Called by the choices slot. */
  bindChoices: (el: HTMLElement) => () => void;
  /** Fades in the choices or the outcome when they swap, after the first frame. */
  enterSwap: (el: HTMLElement) => void;
  /** Starts counting swaps after the first frame, and the deadline. Called by the root slot. */
  bindRoot: () => () => void;
  /**
   * Takes the text the box already holds, expands it and moves focus into it when Deny opens it, and collapses it
   * when Cancel closes it or a decision is recorded. Called by the reason slot.
   */
  bindReason: (el: HTMLElement) => () => void;
};

type Slot<Public extends object = Record<never, never>> = SlotDefinition<
  ConfirmationState,
  ConfirmationApi,
  BaseSlotProps,
  Public
>;

type ChoiceState = { label: string; pending: boolean };

type ConfirmationSlots = {
  root: Slot;
  title: Slot<{ label: string }>;
  meta: Slot<{ text: string }>;
  risk: Slot<{ text: string }>;
  "risk-icon": Slot;
  reason: Slot<ConfirmationReasonState>;
  choices: Slot;
  approve: Slot<ChoiceState>;
  always: Slot<ChoiceState>;
  deny: Slot<ChoiceState>;
  cancel: Slot;
  error: Slot;
  detail: Slot<{ text: string }>;
  outcome: Slot<{ label: string; reason: string | undefined }>;
  "outcome-icon": Slot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ConfirmationPrimitive = ReturnType<
  typeof definePrimitive<ConfirmationOptions, ConfirmationState, ConfirmationApi, ConfirmationSlots>
>;

// Reads `options` rather than spreading it: on Web Components, `@ui-sdk/web` fills in the callbacks on read.
const presentation = (options: ConfirmationOptions) => {
  const { approval, alwaysTarget, alwaysScope } = options;
  const alwaysLabel = [options.alwaysLabel ?? WORDS.alwaysAllow, alwaysTarget && `\`${alwaysTarget}\``]
    .filter(Boolean)
    .join(" ");
  return {
    label: options.label ? plainText(options.label) : WORDS.approvalRequest,
    title: options.label,
    approvalState: approval?.state,
    key: approval ? approvalKey(approval) : "",
    actionable: isActionable(approval),
    approved: approval?.decision?.approved,
    outcome: approvalLabel(approval, { target: alwaysTarget, scope: alwaysScope }),
    outcomeReason: approval?.decision?.approved === false ? approval.decision.reason : undefined,
    outcomeMark: approvalMark(approval),
    expiresAt: approval?.expiresAt,
    canApprove: options.onApprove !== undefined,
    canDeny: options.onDeny !== undefined,
    canAlwaysAllow: options.onAlwaysAllow !== undefined && options.risk !== "danger",
    alwaysLabel,
    alwaysName: [plainText(alwaysLabel), alwaysScope].filter(Boolean).join(" "),
    alwaysDetail: options.alwaysDetail,
    risk: options.risk === "danger" ? ("danger" as const) : undefined,
    riskText: options.riskText,
    reason: options.reason ?? false,
    approveLabel: options.approveLabel ?? WORDS.approve,
    denyLabel: options.denyLabel ?? WORDS.deny,
    motion: options.motion ?? "auto",
  };
};

const isLocked = (state: ConfirmationState) => state.pending || state.sent;

const showsChoices = (state: ConfirmationState) =>
  (state.canApprove || state.canDeny || state.canAlwaysAllow) && (state.actionable || isLocked(state));

const showsReason = (state: ConfirmationState) =>
  state.reason &&
  state.composing &&
  state.canDeny &&
  state.approvalState !== undefined &&
  !isSettled(state.approvalState);

const choiceKind = (state: ConfirmationState, choice: ConfirmationChoice) =>
  choice !== "approve" ? "secondary" : state.risk === "danger" ? "danger" : "primary";

const choiceAttrs = (state: ConfirmationState, choice: ConfirmationChoice) => ({
  type: "button",
  "data-kind-button": choiceKind(state, choice),
  "aria-disabled": state.actionable && !isLocked(state) ? undefined : "true",
  "data-pending": state.pressed === choice ? "" : undefined,
});

/** The meta's words: "Sending decision" while a decision is in flight, else the deadline while one counts. */
export const confirmationMeta = (state: ConfirmationState): string => {
  if (isLocked(state)) return WORDS.sending;
  if (!state.actionable || !state.expiresAt || state.deadline === null) return "";
  const left = countdownText(state.deadline);
  return left ? `${WORDS.decide} ${left}` : WORDS.deadlinePassed;
};

export const confirmationPrimitive: ConfirmationPrimitive = definePrimitive<
  ConfirmationOptions,
  ConfirmationState,
  ConfirmationApi,
  ConfirmationSlots
>({
  name: "kind-confirmation",
  options: {
    approval: "value",
    label: "string",
    onApprove: "action",
    onDeny: "action",
    onAlwaysAllow: "action",
    reason: "boolean",
    approveLabel: "string",
    denyLabel: "string",
    alwaysLabel: "string",
    alwaysTarget: "string",
    alwaysScope: "string",
    alwaysDetail: "string",
    risk: "string",
    riskText: "string",
    focusFallback: "value",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    deadline: null,
    pending: false,
    sent: false,
    pressed: undefined,
    reasonText: "",
    composing: false,
    stacked: false,
    reasonClosing: false,
  }),
  sync: presentation,
  controlled: ["approvalState"],
  live: ["deadline"],
  api: (context) => {
    const { store } = context;
    const pending = createPendingAction(context, { state: "pending", key: () => store.get().key });
    const deadline = createCountdown(context, {
      key: "deadline",
      at: () => (store.get().actionable ? store.get().expiresAt : undefined),
      minutes: true,
    });
    const controller = createInputController();
    let mounting = true;
    // Set by a person's Deny, so the box that press opens takes focus, and no other opening does.
    let opening = false;
    let reported = {
      key: store.get().key,
      id: context.options().approval?.approvalId ?? "",
      state: store.get().approvalState,
    };

    // `store.get()` may already hold the new options here (`@ui-sdk/svelte` hands them over through `follow`), so
    // whether the box was shown is read from the last options.
    let previous = context.options();
    // Spec §4.1: the lock holds until the host reports on the request or replaces it; `submitting` keeps it.
    context.onOptions((options) => {
      const before = previous;
      previous = options;
      const { approval } = options;
      const key = approval ? approvalKey(approval) : "";
      const id = approval?.approvalId ?? "";
      const state = approval?.state;
      if (key === reported.key && state === reported.state) return;
      const replaced = key !== reported.key;
      if (id !== reported.id && store.get().reasonText) {
        store.set({ reasonText: "" });
        controller.setValue("");
      }
      const done = id !== reported.id || isSettled(state);
      reported = { key, id, state };
      if (replaced || state === "submit-failed" || isSettled(state)) pending.release();
      const closing =
        !mounting && isSettled(state) && showsReason({ ...store.get(), ...presentation(before) });
      store.set({
        sent: false,
        ...(!store.get().pending && { pressed: undefined }),
        ...(done && { composing: false }),
        ...(closing && { reasonClosing: true }),
      });
      // From the options, since React hands the store the synced state only after this listener runs.
      const { outcome, outcomeReason } = presentation(options);
      if (mounting) return;
      if (state === "submit-failed") announce(WORDS.notSent, { priority: "polite" });
      else if (isSettled(state) && outcome)
        announce([plainText(outcome), outcomeReason].filter(Boolean).join(" "), { priority: "polite" });
    });

    const decide = (choice: ConfirmationChoice, event?: Event, reason?: string) => {
      const { approval, onApprove, onDeny, onAlwaysAllow, alwaysScope } = context.options();
      const callback = choice === "approve" ? onApprove : choice === "always" ? onAlwaysAllow : onDeny;
      const state = store.get();
      if (!callback || !approval || !state.actionable || isLocked(state)) return;
      if (choice === "always" && !state.canAlwaysAllow) return;
      const decision: ConfirmationDecision = {
        approvalId: approval.approvalId,
        generation: approval.generation,
        ...(reason && { reason }),
        ...(choice === "always" && { always: true as const, ...(alwaysScope && { scope: alwaysScope }) }),
      };
      const details = { source: actionSource(event, "decision-press") };
      const asked = reported;
      // Before the call, so a host that reports back inside it clears the mark.
      store.set({ pressed: choice });
      void pending
        .run(() => callback(decision, details))
        ?.then((outcome) => {
          if (outcome === "stale") return;
          if (outcome === "done" && reported === asked) store.set({ sent: true });
          else store.set({ pressed: undefined });
        });
    };
    const offered = (name: "canApprove" | "canDeny" | "canAlwaysAllow") => {
      const state = store.get();
      return state[name] && state.actionable && !isLocked(state);
    };
    const deny = (reason?: string, event?: Event) => {
      if (reason !== undefined) {
        store.set({ reasonText: reason });
        controller.setValue(reason);
      }
      decide("deny", event, (reason ?? store.get().reasonText).trim());
    };
    const openReason = () => {
      opening = true;
      store.set({ composing: true, reasonClosing: false });
    };
    const reasonState = memo((readOnly: boolean): ConfirmationReasonState => ({ controller, readOnly }));

    return {
      get approve() {
        return offered("canApprove") ? () => decide("approve") : undefined;
      },
      get alwaysAllow() {
        return offered("canAlwaysAllow") ? () => decide("always") : undefined;
      },
      get deny() {
        return offered("canDeny") ? (reason?: string) => deny(reason) : undefined;
      },
      press: (choice, event) => {
        if (choice !== "deny") return decide(choice, event);
        // A person writes the reason; an agent's press decides at once, as its `deny` does.
        const person = actionSource(event, "decision-press") !== "agent";
        if (person && store.get().reason && !store.get().composing && offered("canDeny")) return openReason();
        deny(undefined, event);
      },
      cancelReason: () => {
        const state = store.get();
        if (!state.composing || isLocked(state)) return;
        // The box may already be gone, when the host turned `reason` or `onDeny` off while it was open.
        store.set({ composing: false, reasonClosing: Boolean(showsReason(state)) });
      },
      reasonState: (state) => reasonState(!state.actionable || isLocked(state)),
      recovery: createFocusRecovery({
        fallback: () => context.options().focusFallback?.() ?? context.element("outcome"),
      }),
      cancelRecovery: createFocusRecovery({ fallback: () => context.element("deny") }),
      bindChoices: (el) => {
        // The buttons' own widths and the gaps between them, against the row: a stacked row reads the same widths,
        // so stacking never undoes itself.
        const buttons = () => [...el.querySelectorAll<HTMLElement>("[data-kind-button]")];
        const measure = () => {
          const shown = buttons().filter((button) => button.offsetWidth > 0);
          const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
          const needed =
            shown.reduce((sum, button) => sum + button.offsetWidth, 0) + gap * (shown.length - 1);
          const stacked = shown.length > 2 && needed > el.clientWidth;
          if (stacked !== store.get().stacked) store.set({ stacked });
        };
        const observer = new ResizeObserver(measure);
        let watched: HTMLElement[] | undefined;
        let bound = true;
        // Watches the buttons shown now, again only when they change, so a deadline tick reads no layout.
        const observe = () => {
          const shown = buttons();
          if (!bound || (shown.length === watched?.length && shown.every((b, i) => b === watched?.[i])))
            return;
          watched = shown;
          observer.disconnect();
          observer.observe(el);
          for (const button of shown) observer.observe(button);
        };
        observe();
        const unsubscribe = store.subscribe(() => queueMicrotask(observe));
        return () => {
          bound = false;
          unsubscribe();
          observer.disconnect();
        };
      },
      enterSwap: (el) => {
        if (!mounting) void enter(el, "fade", { motion: store.get().motion });
      },
      bindRoot: () => {
        // Starts UI SDK's input tracking, which `actionSource` reads, so a first decision by key or pointer reports
        // its source rather than "virtual". In `bind`, since a server creates the api too.
        sourceOf();
        const frame = requestAnimationFrame(() => {
          mounting = false;
        });
        const stop = deadline.bind();
        return () => {
          cancelAnimationFrame(frame);
          stop();
        };
      },
      bindReason: (el) => {
        // A web element put back in the page gets a new instance, while its textarea keeps the text.
        const text = el.querySelector("textarea")?.value;
        if (text && text !== store.get().reasonText) store.set({ reasonText: text });
        // React mounts the box once it's open; a web box is in the page already, and shows once UI SDK drops its
        // `hidden` after this store change.
        const expand = () => {
          if (!opening || el.hidden) return;
          opening = false;
          void enter(el, "expand", { motion: store.get().motion });
          // `@ui-sdk/svelte` binds this part before the Textarea inside it attaches to the controller.
          queueMicrotask(() => controller.focus());
        };
        const collapse = () => {
          if (!store.get().reasonClosing) return;
          exit(el, "expand", { motion: store.get().motion }).then(
            () => store.set({ reasonClosing: false }),
            () => {},
          );
        };
        expand();
        // `@ui-sdk/solid` takes the new options before `onOptions` runs, so the box leaves the page as its approval
        // is recorded and binds again once `reasonClosing` brings it back.
        collapse();
        const unsubscribe = store.subscribe(() => {
          collapse();
          queueMicrotask(expand);
        });
        return () => {
          unsubscribe();
          cancel(el);
          if (store.get().reasonClosing) store.set({ reasonClosing: false });
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({
        "aria-label": state.label,
        "aria-busy": isLocked(state) ? "true" : undefined,
        "data-state": state.approvalState,
        "data-motion": state.motion,
        // Spec §6: an agent's decision always needs a person.
        "data-agent-confirm": "Approves or denies the request for you",
      }),
      bind: (_el, { api }) => api.bindRoot(),
    }),
    // Stays through the outcome, so a transcript reads the question before what was decided.
    title: slot<BaseSlotProps, { label: string }>({
      present: (state) => state.title !== undefined,
      state: (state) => ({ label: state.title ?? "" }),
    }),
    // Beside the title: "Sending decision", else the deadline. Reads the live `deadline`, so a tick renders it alone.
    meta: slot<BaseSlotProps, { text: string }>({
      present: (state) => confirmationMeta(state) !== "",
      state: (state) => ({ text: confirmationMeta(state) }),
    }),
    risk: slot<BaseSlotProps, { text: string }>({
      present: (state) => Boolean(state.riskText) && showsChoices(state),
      state: (state) => ({ text: state.riskText ?? "" }),
    }),
    // The warning mark carries the color; the risk's words stay ink.
    "risk-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "warning",
        "data-motion": state.motion,
      }),
    }),
    // Opens on a person's Deny and stays through `submitting`, so the decision moves nothing; collapses on Cancel or
    // once a decision is recorded.
    reason: slot<BaseSlotProps, ConfirmationReasonState>({
      present: (state) => showsReason(state) || state.reasonClosing,
      state: (state, { api }) => api.reasonState(state),
      on: {
        input: (event, { store }) => store.set({ reasonText: (event.target as HTMLTextAreaElement).value }),
      },
      bind: (el, { api }) => api.bindReason(el),
    }),
    choices: slot({
      present: showsChoices,
      attrs: (state) => ({ "data-stacked": state.stacked ? "" : undefined }),
      bind: (el, { api }) => {
        api.enterSwap(el);
        return api.bindChoices(el);
      },
    }),
    // Approves too, so it leaves with Approve while the reason box is open.
    always: slot<BaseSlotProps, ChoiceState>({
      role: "button",
      focus: "native",
      present: (state) => state.canAlwaysAllow && showsChoices(state) && !showsReason(state),
      press: ({ api }, event) => api.press("always", event),
      state: (state) => ({ label: state.alwaysLabel, pending: state.pressed === "always" }),
      attrs: (state) => ({
        ...choiceAttrs(state, "always"),
        "aria-label": state.alwaysName,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    approve: slot<BaseSlotProps, ChoiceState>({
      role: "button",
      focus: "native",
      present: (state) => state.canApprove && showsChoices(state) && !showsReason(state),
      press: ({ api }, event) => api.press("approve", event),
      state: (state) => ({ label: state.approveLabel, pending: state.pressed === "approve" }),
      attrs: (state) => choiceAttrs(state, "approve"),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    deny: slot<BaseSlotProps, ChoiceState>({
      role: "button",
      focus: "native",
      present: (state) => state.canDeny && showsChoices(state),
      press: ({ api }, event) => api.press("deny", event),
      state: (state) => ({ label: state.denyLabel, pending: state.pressed === "deny" }),
      attrs: (state) => choiceAttrs(state, "deny"),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    cancel: slot({
      role: "button",
      focus: "native",
      present: (state) => Boolean(showsReason(state)) && showsChoices(state),
      press: ({ api }) => api.cancelReason(),
      attrs: (state) => ({
        type: "button",
        "data-kind-button": "",
        "aria-disabled": isLocked(state) ? "true" : undefined,
      }),
      bind: (el, part) => part.api.cancelRecovery.bind(el, part),
    }),
    // In the choices row, so a failure moves nothing.
    error: slot({
      present: (state) => state.approvalState === "submit-failed" && showsChoices(state),
    }),
    // Under the choices while Always allow shows, so the scope is read before it's chosen.
    detail: slot<BaseSlotProps, { text: string }>({
      present: (state) =>
        Boolean(state.alwaysDetail) && state.canAlwaysAllow && showsChoices(state) && !showsReason(state),
      state: (state) => ({ text: state.alwaysDetail ?? "" }),
    }),
    // Takes the choices' place at their height. A Tab stop, so focus has somewhere to go when the choices leave.
    outcome: slot<BaseSlotProps, { label: string; reason: string | undefined }>({
      focus: "tab-stop",
      present: (state) => state.outcome !== undefined && !showsChoices(state),
      state: (state) => ({ label: state.outcome ?? "", reason: state.outcomeReason }),
      // Keeps the height of choices that stacked, so the swap moves nothing below.
      attrs: (state) => ({
        tabindex: "0",
        "data-state": state.approvalState,
        "data-stacked": state.stacked ? "" : undefined,
      }),
      bind: (el, { api }) => api.enterSwap(el),
    }),
    "outcome-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": state.outcomeMark,
        "data-motion": state.motion,
      }),
    }),
  }),
  agent: { actions: ["approve", "alwaysAllow", "deny"] },
});
