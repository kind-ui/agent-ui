import { connectionStatusPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

const parts = createParts(connectionStatusPrimitive, {
  root: "div",
  mark: "span",
  text: "span",
  retry: "button",
});

/** The bare root, for arranging the parts yourself. */
export const ConnectionStatusRoot = parts.Root;
export const ConnectionStatusMark = parts.Mark;

/** The state's words, or the countdown while reconnecting, unless you fill the default slot. */
export const ConnectionStatusText = defineComponent({
  name: "ConnectionStatusText",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Text, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { text: string } }) => state.text),
      });
  },
}) as unknown as typeof parts.Text;

/** "Retry", unless you fill the default slot. Rendered only with `on-retry`. */
export const ConnectionStatusRetry = defineComponent({
  name: "ConnectionStatusRetry",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Retry, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
}) as unknown as typeof parts.Retry;

/**
 * The connection as a pill over the top of a conversation: its mark, its words and Retry while `on-retry` is set.
 * Put it inside the Conversation, beside the viewport. To arrange the parts yourself, use `ConnectionStatusRoot`.
 */
export const ConnectionStatus = defineComponent({
  name: "ConnectionStatus",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        render: slots.render,
        default: () => [h(ConnectionStatusMark), h(ConnectionStatusText), h(ConnectionStatusRetry)],
      });
  },
}) as unknown as typeof parts.Root;
