import { createSignal } from "solid-js";
import { Checkpoint } from "@/components/ui/solid/checkpoint";

export default function CheckpointScopeExample() {
  const [restored, setRestored] = createSignal(false);
  return (
    <Checkpoint
      class="w-full max-w-md"
      description="Before “Switch to the session table”, 4 min ago."
      scopes={["both", "code", "conversation"]}
      changes={{ files: 3, additions: 12, deletions: 40 }}
      laterMessages={4}
      unrestorableMessages={2}
      restored={restored()}
      onRestore={() => new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => setRestored(true))}
    />
  );
}
