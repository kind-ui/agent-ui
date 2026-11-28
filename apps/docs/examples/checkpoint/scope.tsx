"use client";
import { useState } from "react";
import { Checkpoint } from "@/components/ui/checkpoint";

export default function CheckpointScopeExample() {
  const [restored, setRestored] = useState(false);
  return (
    <Checkpoint
      className="w-full max-w-md"
      description="Before “Switch to the session table”, 4 min ago."
      scopes={["both", "code", "conversation"]}
      changes={{ files: 3, additions: 12, deletions: 40 }}
      laterMessages={4}
      unrestorableMessages={2}
      restored={restored}
      onRestore={() => new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => setRestored(true))}
    />
  );
}
