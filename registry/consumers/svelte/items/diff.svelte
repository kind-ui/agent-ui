<script lang="ts">
  import { Diff } from "../components/ui/svelte/diff/index.js";
</script>

<Diff file={{ path: "src/greet.ts" }} before={"const greeting = 1;\n"} after={"const greeting = 2;\n"} />
