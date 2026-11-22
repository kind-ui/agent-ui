<script lang="ts">
  import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import { ConnectionStatus } from "@/components/ui/svelte/connection-status/index.js";
  import {
    Conversation,
    ConversationContent,
    ConversationRow,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";

  type Connection = "online" | "reconnecting" | "offline";

  const messages = [
    { id: "m1", role: "user", text: "Why did the deploy to staging stop halfway?" },
    {
      id: "m2",
      role: "assistant",
      text: "The migration step timed out waiting for a lock on the orders table. A long report query was holding it.",
    },
    { id: "m3", role: "user", text: "Can you rerun it once the query finishes?" },
  ];

  const states: Connection[] = ["online", "reconnecting", "offline"];

  const inFiveSeconds = () => new Date(Date.now() + 5000).toISOString();

  let connection: Connection = $state("reconnecting");
  let retryAt = $state(inFiveSeconds());

  const choose = (next: Connection) => {
    if (next === "reconnecting") retryAt = inFiveSeconds();
    connection = next;
  };
  const retry = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        connection = "online";
        resolve();
      }, 800);
    });
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  <fieldset class="flex flex-wrap gap-1 self-start border-0 p-0 text-sm">
    <legend class="sr-only">Connection</legend>
    {#each states as option (option)}
      <button
        type="button"
        aria-pressed={connection === option}
        onclick={() => choose(option)}
        class="w-28 rounded-md border border-[var(--kind-color-border)] py-1 capitalize aria-pressed:bg-[var(--kind-color-hover)]"
      >
        {option}
      </button>
    {/each}
  </fieldset>
  <Conversation
    aria-label="Conversation"
    messageCount={messages.length}
    class="h-56 rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        {#each messages as message, index (message.id)}
          <ConversationRow value={message.id} {index}>
            <p
              class={message.role === "user"
                ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                : undefined}
            >
              {message.text}
            </p>
          </ConversationRow>
        {/each}
      </ConversationContent>
    </ConversationViewport>
    <ConnectionStatus state={connection} {retryAt} onRetry={retry} />
  </Conversation>
  <Composer aria-label="Message" disabled={connection === "offline"}>
    <ComposerInput aria-label="Prompt" placeholder={connection === "offline" ? "Offline" : "Ask anything"} />
    <ComposerSubmit />
  </Composer>
</div>
