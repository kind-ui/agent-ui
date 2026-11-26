import { announce, definePrimitive, type SlotDefinition, sourceOf } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { AgentInfo, Approval, StepStatus } from "../../types/index.js";
import { isActionable } from "../approval.js";
import {
  type ApprovalPartOptions,
  type ApprovalPartState,
  type ApprovalState,
  approvalPart,
} from "../approval-part.js";
import { avatarInitials } from "../avatar.js";
import type { MotionMode } from "../motion/index.js";

/** A person a conversation is handed to or from, shown by name with no avatar. */
export type HandoffPerson = { kind: "person"; name: string };

/** Who hands the conversation off, or takes it: an agent or a person. */
export type HandoffParty = AgentInfo | HandoffPerson;

/** Where a handoff stands. */
export type HandoffStatus = "pending" | "accepted" | "declined" | "complete";

export type HandoffOptions = ApprovalPartOptions & {
  /** Who hands the conversation off. */
  from?: HandoffParty;
  /** Who takes it. */
  to?: HandoffParty;
  /** Why, shown as a quote. */
  reason?: string;
  /**
   * Where the handoff stands. Taking it from `pending` to `accepted` announces "Handed off to <to>", and to
   * `declined` announces "<to> declined".
   * @default "pending"
   */
  status?: HandoffStatus;
  /**
   * An approval the handoff waits on, decided through a Confirmation asking "Let <to> take over?" with the choices
   * whose callbacks are set.
   */
  approval?: Approval;
  /** Names the handoff. Defaults to "Handoff to <to>", or "Handoff" without a `to`. */
  label?: string;
  /**
   * How the status mark and the approval's choices change. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

/** An agent's avatar: its image, else its initials. */
export type HandoffAvatarState = { name: string; initials: string; src: string | undefined };

export type HandoffState = ApprovalState & {
  /** The `from` party's name. */
  fromName: string;
  /** Whether `from` is an agent, which shows an avatar. */
  fromAgent: boolean;
  /** The `from` agent's `avatarUrl`. */
  fromSrc: string | undefined;
  /** The `to` party's name. */
  toName: string;
  /** Whether `to` is an agent, which shows an avatar. */
  toAgent: boolean;
  /** The `to` agent's `avatarUrl`. */
  toSrc: string | undefined;
  /** "<from> handed off to <to>". */
  text: string;
  /** The `reason`, or empty. */
  reason: string;
  /** The `status`. */
  status: HandoffStatus;
  /** The status in words: "Waiting", "Accepted", "Declined" or "Done". */
  statusText: string;
  /** The status mark's status. */
  mark: StepStatus;
  /** The `label`, else "Handoff to <to>", else "Handoff". */
  label: string;
  /** The `motion` option. */
  motion: MotionMode;
};

export type HandoffApi = {
  /** Hands the approval part its Confirmation's props. Called by the approval slot. */
  approvalState: (state: HandoffState) => ApprovalPartState;
};

type HandoffSlot<Public extends object = Record<never, never>> = SlotDefinition<
  HandoffState,
  HandoffApi,
  BaseSlotProps,
  Public
>;

type HandoffSlots = {
  root: HandoffSlot;
  "from-avatar": HandoffSlot<HandoffAvatarState>;
  "to-avatar": HandoffSlot<HandoffAvatarState>;
  text: HandoffSlot<{ text: string }>;
  reason: HandoffSlot<{ reason: string }>;
  status: HandoffSlot<{ text: string }>;
  "status-icon": HandoffSlot;
  approval: HandoffSlot<ApprovalPartState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type HandoffPrimitive = ReturnType<
  typeof definePrimitive<HandoffOptions, HandoffState, HandoffApi, HandoffSlots>
>;

const STATUS_TEXT: Record<HandoffStatus, string> = {
  pending: "Waiting",
  accepted: "Accepted",
  declined: "Declined",
  complete: "Done",
};

const isAgent = (party: HandoffParty | undefined): party is AgentInfo =>
  party !== undefined && !("kind" in party && party.kind === "person");

// A web `status` attribute can hold any string.
const statusOf = (options: HandoffOptions): HandoffStatus =>
  options.status && Object.hasOwn(STATUS_TEXT, options.status) ? options.status : "pending";

const markOf = (status: HandoffStatus, approval: Approval | undefined): StepStatus => {
  if (status === "declined") return "cancelled";
  if (status !== "pending") return "complete";
  return isActionable(approval) || approval?.state === "submitting" ? "awaiting-input" : "pending";
};

const presentation = (options: HandoffOptions) => {
  const { from, to } = options;
  const fromName = from?.name ?? "";
  const toName = to?.name ?? "";
  const status = statusOf(options);
  return {
    ...approvalPart.presentation(options.approval, options),
    fromName,
    fromAgent: isAgent(from),
    fromSrc: (isAgent(from) && from.avatarUrl) || undefined,
    toName,
    toAgent: isAgent(to),
    toSrc: (isAgent(to) && to.avatarUrl) || undefined,
    text: `${fromName || "Someone"} handed off to ${toName || "someone"}`,
    reason: options.reason ?? "",
    status,
    statusText: STATUS_TEXT[status],
    mark: markOf(status, options.approval),
    label: options.label ?? (toName ? `Handoff to ${toName}` : "Handoff"),
    motion: options.motion ?? "auto",
  };
};

const avatarSlot = (side: "from" | "to"): HandoffSlot<HandoffAvatarState> => ({
  present: (state) => (side === "from" ? state.fromAgent : state.toAgent),
  state: (state) => {
    const name = side === "from" ? state.fromName : state.toName;
    return { name, initials: avatarInitials(name), src: side === "from" ? state.fromSrc : state.toSrc };
  },
  // The text beside it names both parties.
  attrs: () => ({ "aria-hidden": "true", "data-handoff-part": `${side}-avatar` }),
});

const approval = approvalPart.slot<HandoffState, HandoffApi>();

/**
 * One agent handing the conversation to another agent or a person (spec §4): who from, who to, why, and where it
 * stands in words with its mark. With an approval it asks "Let <to> take over?" through a Confirmation, whose
 * `approve` and `deny` are the handoff's agent actions.
 */
export const handoffPrimitive: HandoffPrimitive = definePrimitive<
  HandoffOptions,
  HandoffState,
  HandoffApi,
  HandoffSlots
>({
  name: "kind-handoff",
  options: {
    ...approvalPart.options,
    from: "value",
    to: "value",
    reason: "string",
    status: "string",
    approval: "value",
    label: "string",
    motion: "string",
  },
  controlled: ["status"],
  state: presentation,
  sync: presentation,
  api: (context) => {
    // Outcomes are announced only for a handoff the host showed waiting, so a conversation's earlier ones are quiet.
    // A web host sets `status` once the element exists, so the default `pending` doesn't count as shown.
    let last = context.store.get().status;
    let saw = context.options().status === "pending";
    let accepted = false;
    context.onOptions((options) => {
      const status = statusOf(options);
      if (options.status === "pending") saw = true;
      if (status === last) return;
      last = status;
      const to = options.to?.name || "someone";
      if (saw && status === "accepted" && !accepted) {
        accepted = true;
        announce(`Handed off to ${to}`, { priority: "polite" });
      } else if (saw && status === "declined") announce(`${to} declined`, { priority: "polite" });
    });
    return {
      approvalState: approvalPart.approvalState<HandoffState>(context, {
        question: (state) => `Let ${state.toName || "them"} take over?`,
        // Nothing else in a handoff takes focus, so a choice that leaves hands it to the Confirmation's outcome.
        fallback: () => undefined,
      }),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      // Starts UI SDK's input tracking, which nothing else in a handoff does, so the Confirmation's first decision
      // reports the key or pointer behind it. In `bind`, since a server creates the primitive too.
      bind: () => {
        sourceOf();
      },
      attrs: (state) => ({
        "aria-label": state.label,
        "data-status": state.status,
        "data-handoff-part": "root",
      }),
    }),
    "from-avatar": slot<BaseSlotProps, HandoffAvatarState>(avatarSlot("from")),
    "to-avatar": slot<BaseSlotProps, HandoffAvatarState>(avatarSlot("to")),
    text: slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: state.text }),
      attrs: () => ({ "data-handoff-part": "text" }),
    }),
    reason: slot<BaseSlotProps, { reason: string }>({
      present: (state) => state.reason !== "",
      state: (state) => ({ reason: state.reason }),
      attrs: () => ({ "data-handoff-part": "reason" }),
    }),
    status: slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: state.statusText }),
      attrs: (state) => ({ "data-handoff-part": "status", "data-status": state.mark }),
    }),
    "status-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": state.mark,
        "data-motion": state.motion,
      }),
    }),
    approval: slot<BaseSlotProps, ApprovalPartState>({
      ...approval,
      attrs: (state, part) => ({ ...approval.attrs?.(state, part), "data-handoff-part": "approval" }),
    }),
  }),
});
