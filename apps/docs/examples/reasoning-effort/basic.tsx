"use client";
import { useState } from "react";
import { ReasoningEffort } from "@/components/ui/reasoning-effort";

export default function ReasoningEffortExample() {
  const [effort, setEffort] = useState<string | null>("medium");
  return <ReasoningEffort value={effort} onValueChange={setEffort} />;
}
