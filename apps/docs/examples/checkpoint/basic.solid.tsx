import { createSignal } from "solid-js";
import { Checkpoint } from "@/components/ui/solid/checkpoint";

export default function CheckpointExample() {
  const [restored, setRestored] = createSignal(false);
  return (
    <Checkpoint
      class="w-full max-w-md"
      description="Before editing auth.ts"
      restored={restored()}
      onRestore={() => new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => setRestored(true))}
    />
  );
}
