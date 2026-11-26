<script lang="ts">
  import { Chat } from "@ai-sdk/svelte";
  import { fromUIMessages, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";
  import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
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
  import { Message, MessageContent } from "@/components/ui/svelte/message/index.js";
  import { Reasoning } from "@/components/ui/svelte/reasoning/index.js";
  import { Tool } from "@/components/ui/svelte/tool/index.js";

  const chat = new Chat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
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
            >
              <MessageContent>
                {#each message.parts as part (part.id)}
                  {#if part.type === "text"}
                    <Markdown source={part.text} streaming={part.state === "streaming"} />
                  {:else if part.type === "reasoning"}
                    <Reasoning status={part.state === "streaming" ? "running" : "complete"} text={part.text} />
                  {:else if part.type === "step" && part.step.kind === "tool"}
                    {@const { call, error } = part.step}
                    {@const approval = call.approval}
                    <Tool
                      {call}
                      {error}
                      onApprove={() =>
                        approval && chat.addToolApprovalResponse(toApprovalResponse(approval, { approved: true }))}
                      onDeny={() =>
                        approval && chat.addToolApprovalResponse(toApprovalResponse(approval, { approved: false }))}
                    />
                  {/if}
                {/each}
              </MessageContent>
            </Message>
          </ConversationRow>
        {/each}
        <ConversationEmpty>
          <ConversationEmptyTitle>Ask the agent to clean up merged branches</ConversationEmptyTitle>
        </ConversationEmpty>
      </ConversationContent>
    </ConversationViewport>
    <ConversationJump />
  </Conversation>
  <Composer aria-label="Message" onSubmit={(draft) => chat.sendMessage({ text: draft.text })} onStop={chat.stop}>
    <ComposerInput aria-label="Prompt" placeholder="Clean up merged branches" />
    <ComposerSubmit />
    <ComposerStop />
  </Composer>
</div>
