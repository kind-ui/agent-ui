import {
  type AgentCardAvatarState,
  type AgentCardNameState,
  type AgentCardStatusState,
  agentCardPrimitive,
} from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/vue/avatar";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence shows the action, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => agentCardPrimitive(options), agentCardPrimitive, {
    options: { ...agentCardPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: agentCardPrimitive.name },
) as typeof agentCardPrimitive;

const parts = createParts(primitive, {
  root: "article",
  avatar: "span",
  name: "div",
  model: "p",
  description: "p",
  capabilities: "ul",
  capability: "li",
  status: "span",
  "status-icon": "span",
  action: "button",
});

// A part whose default slot falls back to `fallback`, as React's default `children` do.
const withDefault = <State, Part extends Component = Component>(
  part: Part,
  name: string,
  fallback: (scope: { state: State }) => VNodeChild,
): Part =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(part as Component, attrs, { ...slots, default: slots.default ?? (fallback as Slot) });
    },
  }) as unknown as Part;

/** The bare root, for arranging the parts yourself. */
export const AgentCardRoot = parts.Root;
export const AgentCardCapability = parts.Capability;
export const AgentCardStatusIcon = parts.StatusIcon;

/** A UI SDK Avatar of the agent's `avatarUrl`, showing its initials until it loads, unless you fill the slot. */
export const AgentCardAvatar = withDefault<AgentCardAvatarState>(
  parts.Avatar,
  "AgentCardAvatar",
  ({ state }) =>
    h(Avatar, null, () => [
      state.src ? h(AvatarImage, { src: state.src, alt: "" }) : null,
      h(AvatarFallback, null, () => state.initials),
    ]),
);

/** The agent's name, a link with an `href`, unless you fill the slot. */
export const AgentCardName = withDefault<AgentCardNameState>(parts.Name, "AgentCardName", ({ state }) =>
  state.href ? h("a", { href: state.href }, state.name) : state.name,
);

/** The agent's `model`, unless you fill the slot. Rendered only with one. */
export const AgentCardModel = withDefault<{ model: string }>(
  parts.Model,
  "AgentCardModel",
  ({ state }) => state.model,
);

/** The agent's `description`, unless you fill the slot. Rendered only with one. */
export const AgentCardDescription = withDefault<{ description: string }>(
  parts.Description,
  "AgentCardDescription",
  ({ state }) => state.description,
);

/** A badge for each of the agent's `capabilities`, unless you fill the slot. Rendered only with some. */
export const AgentCardCapabilities = withDefault<{ capabilities: readonly string[] }>(
  parts.Capabilities,
  "AgentCardCapabilities",
  ({ state }) =>
    state.capabilities.map((capability) =>
      h(AgentCardCapability, { key: capability, value: capability }, () => capability),
    ),
);

/** The status mark and its words, like "Working", unless you fill the slot. Rendered only with a `status`. */
export const AgentCardStatus = withDefault<AgentCardStatusState>(
  parts.Status,
  "AgentCardStatus",
  ({ state }) => [h(AgentCardStatusIcon), state.label],
);

/** Calls `onAction`. Reads the `actionLabel` unless you fill the slot. Rendered only while `@action` is bound. */
export const AgentCardAction = withDefault<{ label: string }>(
  parts.Action,
  "AgentCardAction",
  ({ state }) => state.label,
);

/**
 * An agent's identity: its avatar, name, model, status, description and capabilities, and one action while `@action`
 * is bound. To arrange the parts yourself, use `AgentCardRoot`.
 */
export const AgentCard = defineComponent({
  name: "AgentCard",
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () =>
      h(parts.Root, attrs, {
        default: () => [
          h(AgentCardAvatar),
          h(AgentCardName),
          h(AgentCardStatus),
          h(AgentCardModel),
          h(AgentCardAction),
          h(AgentCardDescription),
          h(AgentCardCapabilities),
        ],
      });
  },
}) as unknown as typeof parts.Root;
