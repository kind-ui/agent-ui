<script lang="ts">
  import { Diff } from "../components/ui/svelte/diff/index.js";
</script>

<Diff files={[{ path: "src/app.ts", before: "const a = 1;\n", after: "const a = 2;\n" }]} />
