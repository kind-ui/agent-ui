<script lang="ts">
  import { StackTrace } from "../components/ui/svelte/stack-trace/index.js";
</script>

<StackTrace stack={"TypeError: x is undefined\n    at main (/app/src/index.ts:7:1)"} onOpenFrame={() => {}} />
