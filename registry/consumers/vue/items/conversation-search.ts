import { h } from "vue";
import { ConversationSearch } from "../components/ui/vue/conversation-search.js";

export default () => h(ConversationSearch, { defaultOpen: true, messages: [{ id: "1", text: "Hello." }] });
