<script lang="ts">
  import {
    Conversation,
    ConversationContent,
    ConversationEmpty,
    ConversationEmptyDescription,
    ConversationEmptyTitle,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";
  import { Suggestion } from "@/components/ui/svelte/suggestion/index.js";

  const suggestions = [
    { id: "summarize", label: "Summarize this repository" },
    { id: "issues", label: "Find good first issues" },
    { id: "tests", label: "Explain the failing test" },
  ];

  let prompt: string | undefined = $state();
</script>

<Conversation
  aria-label="Conversation"
  messageCount={0}
  class="h-96 w-full max-w-xl rounded-xl border border-[var(--kind-color-border)]"
>
  <ConversationViewport>
    <ConversationContent>
      <ConversationEmpty>
        <ConversationEmptyTitle>Ask about kind-ui/agent-ui</ConversationEmptyTitle>
        <ConversationEmptyDescription>
          {prompt ? `Sent: ${prompt}` : "Start from a suggestion, or ask your own question."}
        </ConversationEmptyDescription>
        <Suggestion
          layout="wrap"
          {suggestions}
          onPick={(id: string) => (prompt = suggestions.find((suggestion) => suggestion.id === id)?.label)}
        />
      </ConversationEmpty>
    </ConversationContent>
  </ConversationViewport>
</Conversation>
