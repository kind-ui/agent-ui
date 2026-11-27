<script module lang="ts">
  export const variants = ["all", "fallback", "reduced", "quota"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { Notice } from "../../../../src/svelte/notice/index.js";
  import { expose } from "../../shared/expose.js";
  import { added, type NoticeData, noticeHost, notices, quotaNotices } from "../../shared/notice.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);
  const fallback = $derived(variant === "fallback");
  const { host, dismissed } = noticeHost();
  let items = $state.raw(notices);

  expose({
    kindHost: Object.assign(host, {
      add: () => (items = [...items, added]),
      remove: () => (items = items.filter((item) => item.id !== "error")),
      escalate: () => (items = items.map((item) => (item.id === "info" ? { ...item, variant: "error" } : item))),
      edit: () => (items = items.map((item) => (item.id === "info" ? { ...item, text: "Almost done." } : item))),
    }),
  });

  const dismiss = (item: NoticeData) => async () => {
    await dismissed(item.id);
    items = items.filter((other) => other.id !== item.id);
  };
</script>

{#if variant === "quota"}
  <div class="flex w-full max-w-[36rem] flex-col gap-3 p-6">
    {#each quotaNotices() as item (item.id)}
      <Notice
        id={`notice-${item.id}`}
        variant={item.variant}
        label={item.label}
        resetsAt={item.resetsAt}
        onDismiss={() => dismissed(item.id)}
      >
        {item.text}
        {#snippet actions()}{#each item.actions as action, index (action)}<button
              type="button"
              data-kind-button={index === item.actions.length - 1 ? "secondary" : ""}>{action}</button
            >{/each}{/snippet}
      </Notice>
    {/each}
  </div>
{:else}
  <div class="flex w-[30rem] flex-col gap-3 p-6">
    <button id="above" type="button">Above</button
    >{#each items as item (item.id)}
      <Notice
        id={`notice-${item.id}`}
        variant={item.variant}
        label={item.label}
        {motion}
        onDismiss={item.dismissible ? dismiss(item) : undefined}
        dismissible={item.dismissible || undefined}
        focusFallback={fallback ? () => document.getElementById("above") : undefined}
      >
        {item.text}
        {#snippet actions()}{#if item.action}<button type="button">{item.action}</button>{/if}{/snippet}
      </Notice>
    {/each}<button id="below" type="button"
    >Below</button>
  </div>
{/if}
