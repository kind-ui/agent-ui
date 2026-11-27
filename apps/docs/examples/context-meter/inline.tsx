"use client";
import type { UsageLimit } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { ContextMeter } from "@/components/ui/context-meter";

const HOUR = 3_600_000;

const usageLimits = (now?: number): UsageLimit[] => {
  const at = (hours: number) => (now === undefined ? undefined : new Date(now + hours * HOUR).toISOString());
  return [
    { id: "5-hour", label: "5-hour limit", used: 124, total: 200, windowStartedAt: at(-3), resetsAt: at(2) },
    {
      id: "weekly",
      label: "Weekly limit",
      used: 1_680,
      total: 2_000,
      windowStartedAt: at(-96),
      resetsAt: at(72),
    },
    { id: "credits", label: "Monthly credits", used: 20.5, total: 50, unit: "currency", resetsAt: at(240) },
  ];
};

export default function ContextMeterInlineExample() {
  // Resets are relative to now, which only the browser knows, so the server renders the limits without them.
  const [limits, setLimits] = useState(usageLimits);
  useEffect(() => setLimits(usageLimits(Date.now())), []);

  return <ContextMeter layout="inline" label="Plan usage" limits={limits} className="w-full max-w-md" />;
}
