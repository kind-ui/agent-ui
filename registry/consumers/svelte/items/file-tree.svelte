<script lang="ts">
  import { FileTree } from "../components/ui/svelte/file-tree/index.js";
</script>

<FileTree entries={[{ path: "src/index.ts", change: "modified", additions: 2 }]} />
