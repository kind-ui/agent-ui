import { createSignal } from "solid-js";
import { ReasoningEffort } from "@/components/ui/solid/reasoning-effort";

export default function ReasoningEffortExample() {
  const [effort, setEffort] = createSignal<string | null>("medium");
  return <ReasoningEffort value={effort()} onValueChange={(value) => setEffort(value)} />;
}
