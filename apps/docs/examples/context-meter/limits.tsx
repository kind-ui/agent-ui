"use client";
import type { UsageLimit } from "@kind-ui/agent-ui";
import { useState } from "react";
import { ContextMeter } from "@/components/ui/context-meter";

const HOUR = 3_600_000;
const at = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

const usageLimits = (): UsageLimit[] => [
  { id: "5-hour", label: "5-hour limit", used: 124, total: 200, windowStartedAt: at(-3), resetsAt: at(2) },
  {
    id: "weekly",
    label: "Weekly limit",
    used: 1_680,
    total: 2_000,
    windowStartedAt: at(-96),
    resetsAt: at(72),
  },
];

export default function ContextMeterLimitsExample() {
  const [limits] = useState(usageLimits);
  return <ContextMeter used={41_000} total={128_000} limits={limits} />;
}
