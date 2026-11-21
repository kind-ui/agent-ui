<script module lang="ts">
  export const variants = ["basic", "refused", "preset", "markdown", "many-100", "many-5000"];
</script>

<script lang="ts">
  import {
    type ConversationSearchMessage,
    type ConversationSearchQueryChangeReason,
    type ConversationState,
    createConversationController,
  } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import {
    Conversation,
    ConversationContent,
    ConversationJump,
    ConversationMarks,
    ConversationRow,
    ConversationViewport,
  } from "../../../../src/svelte/conversation/index.js";
  import { ConversationSearch } from "../../../../src/svelte/conversation-search/index.js";
  import { Markdown } from "../../../../src/svelte/markdown/index.js";
  import { expose } from "../../shared/expose.js";
  import { markdownMessage, type SearchRecord, searchMessages } from "../../shared/conversation-search.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const recorded: SearchRecord = { queries: [], opens: [] };

  const messages: ConversationSearchMessage[] = $derived(
    variant === "markdown"
      ? [...searchMessages(3), markdownMessage]
      : searchMessages(variant === "many-100" ? 100 : variant === "many-5000" ? 5000 : 50),
  );
  const virtualize = $derived(variant.startsWith("many-"));
  const refused = $derived(variant === "refused");
  const controlled = $derived(refused || virtualize);
  const defaultQuery = $derived(variant === "preset" ? "rollout" : undefined);

  const controller = createConversationController();
  let marks: readonly number[] = $state.raw([]);
  let query = $state("");

  expose({ kindHost: recorded, kindSearch: { set: (next: string) => (query = next) } });

  const onQueryChange = (next: string, details: ChangeDetails<ConversationSearchQueryChangeReason>) => {
    recorded.queries.push([next, details.reason]);
    if (controlled && !refused) query = next;
  };
  const onOpenChange = (open: boolean, details: { reason: string }) => recorded.opens.push([open, details.reason]);
  const onMarksChange = (next: readonly number[]) => (marks = next);
  const keep = () => {};
</script>

{#snippet row(message: ConversationSearchMessage, index: number)}
  <ConversationRow value={message.id} {index}>
    {#if message.id === "md"}
      <Markdown source={message.text} />
    {:else}
      <p class="truncate" data-message={message.id}>{message.text}</p>
    {/if}
  </ConversationRow>
{/snippet}

<div class="flex flex-col gap-3 bg-[var(--kind-color-surface)] p-4">
  <button type="button" id="before">Before</button
  ><div class="relative w-[32rem]">
    {#if controlled}
      <ConversationSearch
        {messages}
        conversation={controller}
        defaultOpen
        shortcut="mod+f"
        motion="none"
        {onMarksChange}
        {onQueryChange}
        {onOpenChange}
        bind:query={() => query, keep}
      />
    {:else}
      <ConversationSearch
        {messages}
        conversation={controller}
        defaultOpen
        shortcut="mod+f"
        motion="none"
        {onMarksChange}
        {onQueryChange}
        {onOpenChange}
        {defaultQuery}
      />
    {/if}<Conversation
      aria-label="Conversation"
      messageCount={messages.length}
      {virtualize}
      estimateRowHeight={48}
      rowKey={(index: number) => messages[index]?.id ?? String(index)}
      {controller}
      {marks}
      motion="none"
      class="h-[480px] rounded-xl"
    >
      <ConversationViewport>
        <ConversationContent>
          {#snippet children({ rows }: Pick<ConversationState, "rows">)}
            {#if virtualize}
              {#each rows as r (r.index)}
                {@const m = messages[r.index]}
                {#if m}{@render row(m, r.index)}{/if}
              {/each}
            {:else}
              {#each messages as m, i (m.id)}{@render row(m, i)}{/each}
            {/if}
          {/snippet}
        </ConversationContent>
      </ConversationViewport
      ><ConversationJump
      /><ConversationMarks />
    </Conversation>
  </div>
</div>
