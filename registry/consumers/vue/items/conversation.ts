import { h } from "vue";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "../components/ui/vue/conversation.js";

export default () =>
  h(Conversation, { "aria-label": "Chat", messageCount: 1, class: "h-40" }, () => [
    h(ConversationViewport, null, () =>
      h(ConversationContent, null, () =>
        h(ConversationRow, { value: "first", index: 0 }, () => h("p", "Hello.")),
      ),
    ),
    h(ConversationJump),
  ]);
