<script lang="ts">
  import type { Approval } from "@kind-ui/agent-ui";
  import { Terminal } from "@/components/ui/svelte/terminal/index.js";

  const lines = ["> app@1.0.0 test\n", "✓ sign-in.test.ts (12 tests)\n", "✓ session.test.ts (9 tests)"];

  let approval: Approval = $state({ approvalId: "test", generation: 1, state: "requested" });
  let shown = $state(0);
  const record = (decision: Approval["decision"]) => (approval = { ...approval, state: "responded", decision });
  const running = $derived(approval.decision?.approved === true && shown < lines.length);
  const done = $derived(shown === lines.length);

  // Stands in for the command running once it's approved.
  $effect(() => {
    if (!running) return;
    const timer = setTimeout(() => shown++, 600);
    return () => clearTimeout(timer);
  });
</script>

<Terminal
  command="npm test"
  {approval}
  output={lines.slice(0, shown).join("")}
  {...done && { exitCode: 0, durationSeconds: 2 }}
  alwaysTarget="npm test"
  alwaysScope="in this project"
  alwaysDetail="Covers commands starting with `npm test`, in this project."
  onDeny={() => record({ approved: false })}
  onAlwaysAllow={() => record({ approved: true, always: true })}
  onApprove={() => record({ approved: true })}
/>
