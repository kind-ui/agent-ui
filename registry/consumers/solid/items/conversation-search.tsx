import { ConversationSearch } from "../components/ui/solid/conversation-search.js";

export default function ConversationSearchItem() {
  return <ConversationSearch defaultOpen messages={[{ id: "1", text: "Hello." }]} />;
}
