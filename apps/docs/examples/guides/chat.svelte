<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import { fromUIMessages } from "@kind-ui/agent-ui/adapters/ai-sdk";
  import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import {
    Conversation,
    ConversationContent,
    ConversationEmpty,
    ConversationEmptyTitle,
    ConversationJump,
    ConversationRow,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";
  import { Markdown } from "@/components/ui/svelte/markdown/index.js";
  import { Message, MessageContent, MessageOutcome } from "@/components/ui/svelte/message/index.js";

  const chat = new Chat({});
  const rendered = $derived(fromUIMessages(chat.messages, { status: chat.status, error: chat.error }));
</script>

<div class="flex h-96 flex-col gap-3">
  <Conversation aria-label="Chat" messageCount={rendered.length} class="min-h-0 flex-1">
    <ConversationViewport>
      <ConversationContent>
        {#each rendered as message, index (message.id)}
          <ConversationRow value={message.id} {index}>
            <Message
              aria-label={message.role === "user" ? "Your message" : "Assistant message"}
              messageRole={message.role}
              status={message.status}
              error={message.error?.message}
              onRetry={() => chat.regenerate()}
            >
              <MessageContent>
                {#each message.parts as part (part.id)}
                  {#if part.type === "text"}
                    <Markdown source={part.text} streaming={part.state === "streaming"} />
                  {/if}
                {/each}
              </MessageContent>
              <MessageOutcome />
            </Message>
          </ConversationRow>
        {/each}
        <ConversationEmpty>
          <ConversationEmptyTitle>Ask anything</ConversationEmptyTitle>
        </ConversationEmpty>
      </ConversationContent>
    </ConversationViewport>
    <ConversationJump />
  </Conversation>
  <Composer aria-label="Message" onSubmit={(draft) => chat.sendMessage({ text: draft.text })} onStop={chat.stop}>
    <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
    <ComposerSubmit />
    <ComposerStop />
  </Composer>
</div>
