<script lang="ts">
  import { Uploader } from "../components/ui/svelte/uploader/index.js";
</script>

<Uploader
  aria-label="Uploads"
  items={[{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }]}
/>
