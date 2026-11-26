<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";

  export const variants = ["steer", "text", "docked"];

  // An agent needs a person for every composer action, unless the test permits it.
  export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;
</script>

<!--
  A composer while a turn runs. `?text` starts with a draft, `?mode=queue` sends after the turn, `?queue` docks two
  queued messages, `?folded` folds them, `?idle` has no turn running and `?pending` disables Send now.
-->
<script lang="ts">
  import type { QueueItem } from "@kind-ui/agent-ui";
  import { flushSync, untrack } from "svelte";
  import { AddMenu } from "../../../../src/svelte/add-menu/index.js";
  import {
    Composer,
    ComposerInput,
    ComposerSendMenu,
    ComposerStop,
    ComposerSubmit,
  } from "../../../../src/svelte/composer/index.js";
  import { ModelControl } from "../../../../src/svelte/model-control/index.js";
  import { Queue } from "../../../../src/svelte/queue/index.js";
  import { addItems } from "../../shared/add-menu.js";
  import { queuedMessages, steerHost, steerText } from "../../shared/composer-steer.js";
  import { expose } from "../../shared/expose.js";
  import { levels, models } from "../../shared/model-control.js";

  let { variant, params: given }: { variant: string; params: URLSearchParams } = $props();

  const params = untrack(() =>
    variant === "text"
      ? new URLSearchParams("text")
      : variant === "docked"
        ? new URLSearchParams("queue&text")
        : given,
  );

  let running = $state(!params.has("idle"));
  let items: QueueItem[] = $state.raw(params.has("queue") ? queuedMessages : []);
  const host = steerHost(params, {
    items: () => items,
    setItems: (next) => flushSync(() => (items = next)),
    setRunning: (next) => (running = next),
  });
  expose({ setRunning: (next: boolean) => flushSync(() => (running = next)) });
</script>

<div class="mx-auto max-w-xl p-6">
  <Composer
    aria-label="Message"
    {running}
    onSubmit={() => undefined}
    onStop={host.onStop}
    onSteer={host.onSteer}
    steerMode={params.get("mode") === "queue" ? "queue" : "steer"}
    defaultValue={{ text: params.has("text") ? steerText : "", tokens: [], attachments: [] }}
  >
    <Queue
      label="Queued messages"
      {items}
      defaultOpenSections={params.has("folded") ? [] : ["pending"]}
      onSend={host.onSend}
      onEdit={host.onEdit}
      onRemove={host.onRemove}
      {...params.has("pending") ? { sendDisabledReason: "Available after you answer the pending request" } : {}}
    /><ComposerInput aria-label="Prompt" placeholder="Ask anything"
    /><div style="grid-area: attach; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-width: 0">
      <AddMenu items={addItems} onAction={() => undefined}
      /><ModelControl {models} {levels} defaultModel="opus" defaultEffort="high" />
    </div
    ><ComposerSubmit /><ComposerStop /><ComposerSendMenu />
  </Composer>
</div>
