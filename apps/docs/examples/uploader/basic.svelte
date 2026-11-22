<script lang="ts">
  import type { UploadItem } from "@kind-ui/agent-ui/core";
  import { Uploader } from "@/components/ui/svelte/uploader/index.js";

  let items: UploadItem[] = $state.raw([
    { id: "report", name: "quarterly-report.pdf", size: 2_400_000, progress: 42, status: "uploading" },
    { id: "photo", name: "team-offsite.jpg", size: 3_100_000, progress: 100, status: "done" },
    {
      id: "dataset",
      name: "training-set.csv",
      size: 48_000_000,
      progress: 63,
      status: "error",
      error: "Connection lost",
    },
  ]);

  const update = (id: string, change: Partial<UploadItem>) =>
    (items = items.map((item) => (item.id === id ? { ...item, ...change } : item)));
</script>

<Uploader
  aria-label="Uploads"
  {items}
  onFiles={(files: File[]) =>
    (items = [
      ...items,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        progress: 0,
        status: "queued" as const,
      })),
    ])}
  onCancel={(id: string) => update(id, { status: "cancelled" })}
  onRetry={(id: string) => update(id, { status: "uploading", progress: 0 })}
/>
