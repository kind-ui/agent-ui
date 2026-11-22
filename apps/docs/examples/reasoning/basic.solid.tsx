import { Reasoning } from "@/components/ui/solid/reasoning";

export default function ReasoningExample() {
  return (
    <div class="flex flex-col gap-1">
      <Reasoning
        status="complete"
        durationSeconds={4}
        text="The user wants the **cheapest** route. Compare the three fares, then check the layovers."
      />
      <Reasoning
        status="running"
        text="Two of the flights leave before 7 a.m., so rank the third one first."
      />
    </div>
  );
}
