"use client";
import type { EffortLevel } from "@kind-ui/agent-ui";
import { useState } from "react";
import { EffortSlider } from "@/components/ui/effort-slider";

const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "max", label: "Max" },
];

export default function EffortSliderExample() {
  const [effort, setEffort] = useState("high");

  return <EffortSlider levels={levels} value={effort} onValueChange={setEffort} modelLabel="GPT-5" />;
}
