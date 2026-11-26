import { type ApprovalPartState, type HandoffAvatarState, handoffPrimitive } from "@kind-ui/agent-ui/core";
import { Avatar, AvatarFallback, AvatarImage } from "@ui-sdk/vue/avatar";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";
import { Confirmation } from "./confirmation.js";

const parts = createParts(handoffPrimitive, {
  root: "div",
  "from-avatar": "span",
  "to-avatar": "span",
  text: "p",
  reason: "blockquote",
  status: "span",
  "status-icon": "span",
  approval: "div",
});

// A part that fills an empty default slot from its state.
const withDefault = <Part>(part: Part, name: string, fill: (state: never) => unknown) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part as never, attrs, {
          ...slots,
          default: slots.default ?? (({ state }: { state: never }) => fill(state)),
        });
    },
  }) as unknown as Part;

const avatar = (state: HandoffAvatarState) =>
  h(Avatar, null, () => [
    state.src ? h(AvatarImage, { src: state.src, alt: "" }) : null,
    h(AvatarFallback, null, () => state.initials),
  ]);

/** A UI SDK Avatar of the `from` agent, its initials until the image loads, unless you fill the default slot. Agents only. */
export const HandoffFromAvatar = withDefault(parts.FromAvatar, "HandoffFromAvatar", avatar);

/** A UI SDK Avatar of the `to` agent, its initials until the image loads, unless you fill the default slot. Agents only. */
export const HandoffToAvatar = withDefault(parts.ToAvatar, "HandoffToAvatar", avatar);

/** "<from> handed off to <to>", unless you fill the default slot. */
export const HandoffText = withDefault(parts.Text, "HandoffText", (state: { text: string }) => state.text);

/** The `reason`, unless you fill the default slot. Present only with one. */
export const HandoffReason = withDefault(
  parts.Reason,
  "HandoffReason",
  (state: { reason: string }) => state.reason,
);

export const HandoffStatusIcon = parts.StatusIcon;

/** The status mark and the status in words, like "Accepted", unless you fill the default slot. */
export const HandoffStatus = withDefault(parts.Status, "HandoffStatus", (state: { text: string }) => [
  h(HandoffStatusIcon),
  state.text,
]);

/**
 * A Confirmation asking "Let <to> take over?" while there's an approval: the choices whose callbacks are set while
 * the request is open, then what was decided. Fill the default slot to render it yourself.
 */
// Slot state is a proxy with no keys of its own, so the Confirmation's props are read one by one.
export const HandoffApproval = withDefault(parts.Approval, "HandoffApproval", (state: ApprovalPartState) =>
  h(Confirmation, {
    approval: state.approval,
    label: state.label,
    onApprove: state.onApprove,
    onDeny: state.onDeny,
    onAlwaysAllow: state.onAlwaysAllow,
    reason: state.reason,
    focusFallback: state.focusFallback,
    motion: state.motion,
  }),
);

const defaultParts = () => [
  h(HandoffFromAvatar),
  h(HandoffToAvatar),
  h(HandoffText),
  h(HandoffStatus),
  h(HandoffReason),
  h(HandoffApproval),
];

/**
 * One agent handing the conversation to another agent or a person: both avatars, "<from> handed off to <to>", the
 * reason as a quote, the status in words with its mark, and a Confirmation while there's an approval. A default slot
 * replaces the default parts.
 */
export const Handoff = defineComponent({
  name: "Handoff",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? defaultParts });
  },
}) as unknown as typeof parts.Root;
