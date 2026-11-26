import { type ChangeDetails, definePrimitive, dispatch, type SlotDefinition } from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { AgentInfo, StepStatus } from "../../types/index.js";
import { avatarInitials } from "../avatar.js";
import { sanitizeUrl } from "../markdown/index.js";

/** `"action-press"`: a person pressed the action. `"imperative"`: an `api` call, like an agent's `run`. */
export type AgentCardActionReason = "action-press" | "imperative";

export type AgentCardOptions = {
  /** The agent: its `name`, and the `avatarUrl`, `model`, `description` and `capabilities` the card shows. */
  agent?: AgentInfo;
  /** What the agent is doing, shown as a status mark and words. Without it the card shows no status. */
  status?: StepStatus;
  /** Makes the name a link to the agent. Only `http`, `https` and `mailto` URLs link. */
  href?: string;
  /**
   * The name's heading level, 1 to 6. Anything else reads as 3.
   * @default 3
   */
  level?: number;
  /**
   * The action button's text.
   * @default "Open"
   */
  actionLabel?: string;
  /** Called with the agent's `id` when a person presses the action or `run` is called. Shows the action while set. */
  onAction?: (agentId: string, details: ChangeDetails<AgentCardActionReason>) => void;
};

export type AgentCardState = {
  /** The agent's `id`, or empty. */
  id: string;
  /** The agent's `name`, else "Agent". */
  name: string;
  /** The agent's `avatarUrl`. */
  avatarUrl: string | undefined;
  /** The agent's `model`, or empty. */
  model: string;
  /** The agent's `description`, or empty. */
  description: string;
  /** The agent's `capabilities`. */
  capabilities: readonly string[];
  /** The `status` option. */
  status: StepStatus | undefined;
  /** The `href`, once it's a safe URL. */
  href: string | undefined;
  /** The heading level, 1 to 6. */
  level: number;
  /** The `actionLabel`, else "Open". */
  actionLabel: string;
  /** Whether `onAction` is set. */
  canRun: boolean;
};

export type AgentCardApi = {
  /** Calls `onAction`. Offered only while it's set. */
  readonly run: (() => void) | undefined;
  /** Calls `onAction` for a press. Called by the action slot. */
  press: (event?: Event) => void;
};

/** What the avatar slot hands render functions. */
export type AgentCardAvatarState = { name: string; initials: string; src: string | undefined };
/** What the name slot hands render functions: the name, and the safe `href` it links to. */
export type AgentCardNameState = { name: string; href: string | undefined };
/** What the status slot hands render functions: the status in words. */
export type AgentCardStatusState = { label: string };

type CapabilityProps = { value: string };

type Slot<
  Public extends object = Record<never, never>,
  Props extends object = BaseSlotProps,
> = SlotDefinition<AgentCardState, AgentCardApi, Props, Public>;

type AgentCardSlots = {
  root: Slot;
  avatar: Slot<AgentCardAvatarState>;
  name: Slot<AgentCardNameState>;
  model: Slot<{ model: string }>;
  description: Slot<{ description: string }>;
  capabilities: Slot<{ capabilities: readonly string[] }>;
  capability: Slot<Record<never, never>, CapabilityProps & BaseSlotProps>;
  status: Slot<AgentCardStatusState>;
  "status-icon": Slot;
  action: Slot<{ label: string }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type AgentCardPrimitive = ReturnType<
  typeof definePrimitive<AgentCardOptions, AgentCardState, AgentCardApi, AgentCardSlots>
>;

const STATUS_LABELS: Record<StepStatus, string> = {
  pending: "Waiting",
  running: "Working",
  "awaiting-input": "Needs input",
  complete: "Done",
  error: "Failed",
  cancelled: "Stopped",
};

/** The status in words: "Working", "Needs input". */
export const agentCardStatus = (status: StepStatus): string =>
  // A web `status` attribute can hold any string.
  STATUS_LABELS[status] ?? STATUS_LABELS.pending;

const NO_CAPABILITIES: readonly string[] = [];

const presentation = (options: AgentCardOptions): AgentCardState => {
  const { agent, level, href } = options;
  return {
    id: agent?.id ?? "",
    name: agent?.name || "Agent",
    avatarUrl: agent?.avatarUrl || undefined,
    model: agent?.model ?? "",
    description: agent?.description ?? "",
    capabilities: agent?.capabilities?.length ? agent.capabilities : NO_CAPABILITIES,
    status: options.status,
    href: href ? (sanitizeUrl(href) ?? undefined) : undefined,
    // Web attributes are untyped: a level outside 1 to 6 reads as the default.
    level: level !== undefined && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 3,
    actionLabel: options.actionLabel || "Open",
    canRun: options.onAction !== undefined,
  };
};

export const agentCardPrimitive: AgentCardPrimitive = definePrimitive<
  AgentCardOptions,
  AgentCardState,
  AgentCardApi,
  AgentCardSlots
>({
  name: "kind-agent-card",
  options: {
    agent: "value",
    status: "string",
    href: "string",
    level: "number",
    actionLabel: "string",
    onAction: "callback",
  },
  state: presentation,
  sync: presentation,
  api: (context) => {
    const { store } = context;
    const run = (event?: Event) => {
      const { canRun, id } = store.get();
      if (canRun)
        dispatch(
          context,
          "onAction",
          id,
          event ? { reason: "action-press", event } : { reason: "imperative" },
        );
    };
    return {
      get run() {
        return store.get().canRun ? () => run() : undefined;
      },
      press: (event) => run(event),
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "article",
      attrs: (_state, part) => ({ "aria-labelledby": `${part.id}-name`, "data-agent-card-part": "root" }),
    }),
    // The name beside it says who the agent is.
    avatar: slot<BaseSlotProps, AgentCardAvatarState>({
      state: (state) => ({ name: state.name, initials: avatarInitials(state.name), src: state.avatarUrl }),
      attrs: () => ({ "aria-hidden": "true", "data-agent-card-part": "avatar" }),
    }),
    name: slot<BaseSlotProps, AgentCardNameState>({
      role: "heading",
      state: (state) => ({ name: state.name, href: state.href }),
      attrs: (state, part) => ({
        id: `${part.id}-name`,
        "aria-level": String(state.level),
        "data-agent-card-part": "name",
      }),
    }),
    model: slot<BaseSlotProps, { model: string }>({
      present: (state) => state.model !== "",
      state: (state) => ({ model: state.model }),
      attrs: () => ({ "data-agent-card-part": "model" }),
    }),
    description: slot<BaseSlotProps, { description: string }>({
      present: (state) => state.description !== "",
      state: (state) => ({ description: state.description }),
      attrs: () => ({ "data-agent-card-part": "description" }),
    }),
    capabilities: slot<BaseSlotProps, { capabilities: readonly string[] }>({
      role: "list",
      present: (state) => state.capabilities.length > 0,
      state: (state) => ({ capabilities: state.capabilities }),
      attrs: () => ({ "aria-label": "Capabilities", "data-agent-card-part": "capabilities" }),
    }),
    capability: slot<CapabilityProps & BaseSlotProps, Record<never, never>>({
      role: "listitem",
      props: { value: "string" },
      attrs: () => ({ "data-kind-badge": "", "data-agent-card-part": "capability" }),
    }),
    status: slot<BaseSlotProps, AgentCardStatusState>({
      present: (state) => state.status !== undefined,
      state: (state) => ({ label: agentCardStatus(state.status ?? "pending") }),
      attrs: (state) => ({ "data-status": state.status, "data-agent-card-part": "status" }),
    }),
    // The words beside it say the status.
    "status-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": state.status,
        "data-agent-card-part": "status-icon",
      }),
    }),
    action: slot<BaseSlotProps, { label: string }>({
      role: "button",
      focus: "native",
      present: (state) => state.canRun,
      press: ({ api }, event) => api.press(event),
      state: (state) => ({ label: state.actionLabel }),
      attrs: (state) => ({
        type: "button",
        // Starts with its visible text, so a voice command that reads the button still finds it.
        "aria-label": `${state.actionLabel} ${state.name}`,
        "data-kind-button": "secondary",
        "data-kind-size": "sm",
        "data-agent-card-part": "action",
      }),
    }),
  }),
  agent: { actions: ["run"] },
});
