<script module lang="ts">
  export const variants = ["mixed"];
</script>

<script lang="ts">
  import type { MotionMode, UploadItem } from "@kind-ui/agent-ui/core";
  import { Uploader } from "../../../../src/svelte/uploader/index.js";
  import { expose } from "../../shared/expose.js";
  import { uploadHost, uploads } from "../../shared/uploader.js";

  let { params }: { variant: string; params: URLSearchParams } = $props();

  const motion = $derived((params.get("motion") as MotionMode | null) ?? undefined);
  let items: UploadItem[] = $state.raw(uploads);
  const { fixture, ...host } = uploadHost((change) => (items = change(items)));
  expose({ kindUploader: fixture });
</script>

<div class="mx-auto max-w-lg p-6">
  <Uploader aria-label="Uploads" {items} maxSize={5_000_000} {motion} {...host} />
</div>
