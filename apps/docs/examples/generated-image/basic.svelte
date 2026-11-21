<script lang="ts">
  import { GeneratedImage } from "@/components/ui/svelte/generated-image/index.js";
  import lighthouse from "./lighthouse.png";
  import preview from "./lighthouse-preview.png";

  let progress = $state(0);

  $effect(() => {
    if (progress >= 100) return;
    const timer = setTimeout(() => (progress += 5), 250);
    return () => clearTimeout(timer);
  });

  function save() {
    const link = document.createElement("a");
    link.href = lighthouse;
    link.download = "lighthouse.png";
    link.click();
  }
</script>

<div class="flex w-full max-w-md flex-col items-start gap-3">
  <GeneratedImage
    alt="A lighthouse at dusk"
    status={progress < 100 ? "generating" : "ready"}
    {progress}
    preview={progress >= 30 ? preview : undefined}
    src={lighthouse}
    width={768}
    height={512}
    onDownload={save}
    class="w-full"
  />
  <button
    type="button"
    class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm hover:bg-[var(--kind-color-hover)]"
    onclick={() => (progress = 0)}
  >
    Replay
  </button>
</div>
