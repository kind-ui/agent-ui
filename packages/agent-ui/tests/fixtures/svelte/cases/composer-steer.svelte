<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";

  export const variants = ["steer", "steer-mod-enter", "queue"];

  // An agent needs a person for every composer action, unless the test permits it.
  export const allow = (step: AgentAction) =>
    !step.confirm || (window as { permit?: boolean }).permit === true;
</script>

<script lang="ts">
  import type { QueueItem } from "@kind-ui/agent-ui";
  import type { ComposerSteerMode } from "@kind-ui/agent-ui/core";
  import { flushSync } from "svelte";
  import {
    Composer,
    ComposerAttach,
    ComposerInput,
    ComposerSteerMenu,
    ComposerStop,
    ComposerSubmit,
  } from "../../../../src/svelte/composer/index.js";
  import { Queue } from "../../../../src/svelte/queue/index.js";
  import { recorder } from "../../shared/composer.js";
  import { sendRecorder, steerQueue, steerRecorder } from "../../shared/composer-steer.js";
  import { expose } from "../../shared/expose.js";

  let { variant, params }: { variant: string; params: URLSearchParams } = $props();

  // svelte-ignore state_referenced_locally
  let running = $state(!params.has("idle"));
  let items: QueueItem[] = $state.raw(steerQueue);
  const { onSubmit } = recorder();
  const { onSteer, onStop } = steerRecorder();
  const onSend = sendRecorder();
  // svelte-ignore state_referenced_locally
  const steer = params.has("no-steer") ? {} : { onSteer };
  // svelte-ignore state_referenced_locally
  const mode = params.has("mode") ? { steerMode: params.get("mode") as ComposerSteerMode } : {};

  expose({
    setRunning: (next: boolean) => flushSync(() => (running = next)),
    kindQueue: { remove: (id: string) => (items = items.filter((item) => item.id !== id)) },
  });
</script>

{#if variant === "queue"}
  <div class="flex w-[24rem] flex-col gap-4 p-6">
    <Queue label="Queue" {items} {onSend} />
  </div>
{:else}
  <div class="mx-auto max-w-xl p-6">
    <Composer
      aria-label="Message"
      submitOn={variant === "steer-mod-enter" ? "mod-enter" : "enter"}
      {running}
      {onSubmit}
      {onStop}
      {...steer}
      {...mode}
    >
      <ComposerInput aria-label="Prompt" placeholder="Ask anything"
      /><ComposerAttach /><ComposerSubmit /><ComposerSteerMenu /><ComposerStop />
    </Composer>
  </div>
{/if}
