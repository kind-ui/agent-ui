import { subagentPrimitive } from "@kind-ui/agent-ui/core";
import { Avatar, AvatarImage } from "@ui-sdk/vue/avatar";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type Slot, type VNodeChild } from "vue";
import { Markdown } from "./markdown.js";

const parts = createParts(subagentPrimitive, {
  root: "div",
  trigger: "button",
  avatar: "span",
  icon: "span",
  title: "span",
  meta: "span",
  content: "div",
  children: "div",
  cancel: "button",
  result: "div",
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
export const SubagentRoot = parts.Root;
export const SubagentTrigger = parts.Trigger;
export const SubagentIcon = parts.Icon;
export const SubagentContent = parts.Content;
export const SubagentChildren = parts.Children;

/** A UI SDK Avatar of `avatarSrc`, unless you fill the slot. Rendered only with an `avatarSrc`. */
export const SubagentAvatar = withDefault<{ src: string | undefined }>(
  parts.Avatar,
  "SubagentAvatar",
  ({ state }) => h(Avatar, null, () => h(AvatarImage, { src: state.src, alt: "" })),
);

/** The `label`, else the `agentName`, unless you fill the slot. */
export const SubagentTitle = withDefault<{ title: string }>(
  parts.Title,
  "SubagentTitle",
  ({ state }) => state.title,
);

/** The status in words, like "Working" or "Done in 12 s", unless you fill the slot. */
export const SubagentMeta = withDefault<{ label: string }>(
  parts.Meta,
  "SubagentMeta",
  ({ state }) => state.label,
);

/** Calls `onCancel`. Reads "Stop" unless you fill the slot. Rendered only while the subagent can be stopped. */
export const SubagentCancel = withDefault(parts.Cancel, "SubagentCancel", () => [
  h("span", {
    "data-kind-pending-mark": "",
    "data-status-mark": "",
    "data-status": "running",
    "aria-hidden": "true",
  }),
  "Stop",
]);

/** The `result` as markdown, unless you fill the slot. Rendered only once the status is `complete`. */
export const SubagentResult = withDefault<{ result: string }>(parts.Result, "SubagentResult", ({ state }) =>
  state.result ? h(Markdown, { source: state.result }) : null,
);

/**
 * A subagent's run: its status, name and avatar, then its own steps, a Stop button while `onCancel` is set, and its
 * `result` once complete. Its default slot holds the steps, like a `StepList` of `Tool`s; to arrange the parts
 * yourself, use `SubagentRoot`.
 */
export const Subagent = defineComponent({
  name: "Subagent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: () => [
          h(SubagentTrigger, null, () => [
            h(SubagentIcon),
            h(SubagentAvatar),
            h(SubagentTitle),
            h(SubagentMeta),
          ]),
          h(SubagentContent, null, () => h(SubagentChildren, null, () => slots.default?.())),
          h(SubagentCancel),
          h(SubagentResult),
        ],
      });
  },
});
