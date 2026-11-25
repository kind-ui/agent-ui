<script module lang="ts">
  export const variants = ["all", "clock"];
</script>

<script lang="ts">
  import { QuotaNotice } from "../../../../src/svelte/quota-notice/index.js";
  import { expose } from "../../shared/expose.js";
  import { clock, quota, quotaHost, spent } from "../../shared/quota-notice.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const times = $derived(
    variant === "clock" ? { resetAt: clock.resetAt } : { resetAt: quota.resetAt, now: quota.now },
  );
  const host = quotaHost();
  let used = $state(quota.used);
  let shown = $state(true);

  expose({ kindHost: Object.assign(host, { setUsed: (value: number) => (used = value) }) });
</script>

<div class="flex w-[30rem] flex-col gap-3 p-6">
  <button id="above" type="button">Above</button
  >{#if shown}<QuotaNotice
      id="quota"
      {used}
      limit={quota.limit}
      period={quota.period}
      {...times}
      onUpgrade={(details: { source: string }) => host.upgrades.push(details.source)}
      onDismiss={() => {
        host.dismisses += 1;
        shown = false;
      }}
    />{/if}<QuotaNotice id="quota-spent" used={spent.used} limit={spent.limit} unit={spent.unit}
    >Answers use a smaller model until your plan renews.</QuotaNotice
  ><button id="below" type="button">Below</button>
</div>
