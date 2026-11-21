import { h } from "vue";
import { KindToolbar, KindToolbarButton } from "../components/ui/vue/internal/toolbar.js";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "../components/ui/vue/message.js";

export default () =>
  h(Message, { "aria-label": "Reply", messageRole: "assistant", text: "Retry with backoff." }, () => [
    h(MessageContent, null, () => "Retry with backoff."),
    h(MessageToolbar, null, () =>
      h(KindToolbar, { "aria-label": "Reply actions" }, () =>
        h(MessageCopy, null, () => h(KindToolbarButton, { "aria-label": "Copy" })),
      ),
    ),
  ]);
