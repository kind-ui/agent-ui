import type { UsageSlice } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { ContextMeter } from "@/components/ui/solid/context-meter";

const full: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 41_200 },
  { id: "files", label: "Files", value: 18_100 },
  { id: "tools", label: "Tools", value: 9_800 },
  { id: "system", label: "System", value: 3_800 },
];

const compacted: UsageSlice[] = [
  { id: "messages", label: "Messages", value: 4_600 },
  { id: "files", label: "Files", value: 3_600 },
  { id: "tools", label: "Tools", value: 0 },
  { id: "system", label: "System", value: 3_800 },
];

const sum = (slices: UsageSlice[]) => slices.reduce((total, slice) => total + slice.value, 0);

export default function ContextMeterBreakdownExample() {
  const [breakdown, setBreakdown] = createSignal(full);

  const compact = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setBreakdown(compacted);
        resolve();
      }, 1500);
    });

  return (
    <ContextMeter
      used={sum(breakdown())}
      total={128_000}
      breakdown={breakdown()}
      compactAt={0.8}
      onCompact={compact}
    />
  );
}
