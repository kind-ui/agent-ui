<script lang="ts">
  import { ShareDialog } from "@/components/ui/svelte/share-dialog/index.js";

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let visibility: "private" | "link" = $state("private");
  let link: string | undefined = $state();
</script>

<ShareDialog
  bind:visibility
  {link}
  onCreateLink={async () => {
    await wait(800);
    link = "https://example.com/share/billing-export-retries";
  }}
  onRevoke={async () => {
    await wait(400);
    link = undefined;
    visibility = "private";
  }}
/>
