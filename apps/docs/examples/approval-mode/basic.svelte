<script lang="ts">
  import type { ApprovalModeOption } from "@kind-ui/agent-ui";
  import { ApprovalMode } from "@/components/ui/svelte/approval-mode/index.js";

  const modes: ApprovalModeOption[] = [
    { value: "ask", label: "Ask every time", description: "Approve each tool call" },
    { value: "edits", label: "Allow edits", description: "Edit files without asking" },
    { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
  ];

  let value = $state("ask");
</script>

<ApprovalMode {modes} bind:value learnMoreHref="#agent" />
