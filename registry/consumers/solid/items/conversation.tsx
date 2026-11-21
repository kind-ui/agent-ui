import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "../components/ui/solid/conversation.js";

export default function ConversationItem() {
  return (
    <Conversation aria-label="Chat" messageCount={1} class="h-40">
      <ConversationViewport>
        <ConversationContent>
          <ConversationRow value="first" index={0}>
            <p>Hello.</p>
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  );
}
