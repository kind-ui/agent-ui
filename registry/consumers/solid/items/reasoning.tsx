import { Reasoning } from "../components/ui/solid/reasoning.js";

export default function ReasoningItem() {
  return <Reasoning status="complete" durationSeconds={3} text="Checked **two** sources." defaultOpen />;
}
