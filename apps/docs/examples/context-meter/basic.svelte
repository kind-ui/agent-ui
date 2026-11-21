<script lang="ts">
  import { ContextMeter } from "@/components/ui/svelte/context-meter/index.js";
</script>

<ContextMeter
  used={57_600}
  total={128_000}
  usage={{ input: 40_000, output: 12_000, reasoning: 5_600, cached: 20_000 }}
  cost={0.42}
/>
