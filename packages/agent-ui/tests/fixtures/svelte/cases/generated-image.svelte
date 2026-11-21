<script module lang="ts">
  export const variants = ["all", "reduced"];
</script>

<script lang="ts">
  import type { GeneratedImageStatus, MotionMode } from "@kind-ui/agent-ui/core";
  import { GeneratedImage } from "../../../../src/svelte/generated-image/index.js";
  import { expose } from "../../shared/expose.js";
  import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  const recorded: { downloads: string[]; settle?: { resolve(): void; reject(): void } } = { downloads: [] };

  let status: GeneratedImageStatus = $state("generating");
  let progress: number | undefined = $state(40);
  let src: string | undefined = $state();
  let previewUrl: string | undefined = $state(preview);

  expose({
    kindHost: {
      downloads: recorded.downloads,
      resolve: () => recorded.settle?.resolve(),
      reject: () => recorded.settle?.reject(),
      progress: (next: number | undefined) => (progress = next),
      preview: (show: boolean) => (previewUrl = show ? preview : undefined),
      ready: (url: string) => {
        src = url;
        status = "ready";
      },
      fail: () => (status = "error"),
      generate: () => (status = "generating"),
      missing,
    },
  });
</script>

<div class="flex w-[30rem] flex-col gap-4 p-6">
  <GeneratedImage
    id="lifecycle"
    alt="A lighthouse at night"
    {status}
    {progress}
    preview={previewUrl}
    {src}
    {...size}
    {motion}
  />
  <GeneratedImage
    id="loaded"
    alt="A lighthouse at dusk"
    src={lighthouse}
    {...size}
    onDownload={(details) => {
      recorded.downloads.push(details.source);
      return new Promise<void>((resolve, reject) => {
        recorded.settle = { resolve, reject };
      });
    }}
    {motion}
  />
  <GeneratedImage
    id="failed"
    alt="A lighthouse in a storm"
    status="error"
    error="Generation timed out."
    {...size}
    {motion}
  />
</div>
