<script module lang="ts">
  export const variants = ["online", "offline", "reduced"];
</script>

<script lang="ts">
  import type { ConnectionState, MotionMode } from "@kind-ui/agent-ui/core";
  import { flushSync, untrack } from "svelte";
  import { ConnectionStatus } from "../../../../src/svelte/connection-status/index.js";
  import {
    Conversation,
    ConversationContent,
    ConversationRow,
    ConversationViewport,
  } from "../../../../src/svelte/conversation/index.js";
  import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, retried } = connectionHost();
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  let connection: { state: ConnectionState; retryAt?: string | undefined; resuming?: boolean | undefined } =
    $state.raw({ state: untrack(() => (variant === "online" ? "online" : "offline")) });

  const set: ConnectionHost["set"] = (state, options) => flushSync(() => (connection = { state, ...options }));
  expose({ kindHost: Object.assign(host, { set }) });
</script>

<Conversation
  aria-label="Conversation"
  messageCount={messages.length}
  class="m-4 h-[24rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
>
  <ConversationViewport>
    <ConversationContent>
      {#each messages as message, index (message.id)}
        <ConversationRow value={message.id} {index}>
          <p data-message={message.id}>{message.text}</p>
        </ConversationRow>
      {/each}
    </ConversationContent>
  </ConversationViewport
  ><ConnectionStatus
    id="connection"
    state={connection.state}
    retryAt={connection.retryAt}
    resuming={connection.resuming}
    {motion}
    onRetry={retried}
  />
</Conversation>
