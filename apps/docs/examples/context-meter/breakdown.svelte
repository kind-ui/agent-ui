<script lang="ts">
  import type { UsageSlice } from "@kind-ui/agent-ui";
  import { ContextMeter } from "@/components/ui/svelte/context-meter/index.js";

  const full: UsageSlice[] = [
    { id: "messages", label: "Messages", value: 41_200 },
    { id: "files", label: "Files", value: 18_100 },
    { id: "tools", label: "Tools", value: 9_800 },
    { id: "system", label: "System", value: 3_800 },
  ];

  const compacted: UsageSlice[] = [
    { id: "messages", label: "Messages", value: 4_600 },
    { id: "files", label: "Files", value: 3_600 },
    { id: "tools", label: "Tools", value: 0 },
    { id: "system", label: "System", value: 3_800 },
  ];

  let breakdown = $state.raw(full);
  const used = $derived(breakdown.reduce((total, slice) => total + slice.value, 0));

  const compact = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        breakdown = compacted;
        resolve();
      }, 1500);
    });
</script>

<ContextMeter {used} total={128_000} {breakdown} compactAt={0.8} onCompact={compact} />
