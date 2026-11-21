<script lang="ts">
  import { ApprovalMode } from "../components/ui/svelte/approval-mode/index.js";
</script>

<ApprovalMode modes={[{ value: "ask", label: "Ask every time" }]} defaultValue="ask" />
