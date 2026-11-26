<script module lang="ts">
  export const variants = ["all", "warning", "error", "reduced", "requests", "reset"];
</script>

<script lang="ts">
  import { UsageMeter } from "../../../../src/svelte/usage-meter/index.js";
  import { expose } from "../../shared/expose.js";
  import { levels, requests, reset, usage, usageHost } from "../../shared/usage-meter.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = usageHost();
  const initial = (): number =>
    variant === "warning"
      ? levels.warning
      : variant === "error"
        ? levels.error
        : variant === "requests"
          ? requests.used
          : usage.used;
  let used = $state(initial());
  expose({ kindHost: { ...host, setUsed: (value: number) => (used = value) } });
  const extra = $derived(
    variant === "requests"
      ? { ...requests, breakdown: undefined }
      : variant === "reset"
        ? { resetAt: reset.resetAt }
        : {},
  );
</script>

<div class="flex flex-col items-start gap-4 p-6">
  <p id="above">Above</p
  ><div class="flex items-center gap-2">
    <UsageMeter
      id="usage"
      {...usage}
      {used}
      onOpenChange={record}
      motion={variant === "reduced" ? "reduced" : undefined}
      {...extra}
    /><span id="beside">Beside</span>
  </div>
</div>
