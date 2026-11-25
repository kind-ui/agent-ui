<!-- Calls `onbound` once the editor rendered before it has bound, and `onunbound` as it leaves. -->
<script lang="ts">
  import { tick } from "svelte";

  let { onbound, onunbound }: { onbound: () => void; onunbound: () => void } = $props();

  $effect(() => {
    let live = true;
    tick().then(() => live && onbound());
    return () => {
      live = false;
      onunbound();
    };
  });
</script>
