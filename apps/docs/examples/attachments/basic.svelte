<script lang="ts">
  import { Attachments } from "@/components/ui/svelte/attachments/index.js";

  const files = [
    { id: "spec", name: "retry-spec.pdf", size: 482_000, mediaType: "application/pdf" },
    { id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" },
    { id: "fix", name: "retry.ts", size: 3_400 },
    { id: "dump", name: "heap.zip", size: 92_000_000, mediaType: "application/zip", error: "size" as const },
  ];

  let items = $state.raw(files);
</script>

<Attachments
  aria-label="Attachments"
  {items}
  onRemove={(id: string) => (items = items.filter((item) => item.id !== id))}
/>
