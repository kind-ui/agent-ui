"use client";

import type { ToolCall } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Tool } from "@/components/ui/tool";

const base: ToolCall = {
  toolCallId: "call_1",
  name: "fetch_url",
  dynamic: false,
  input: { state: "ready", value: { url: "https://example.com/status" } },
};

type Phase = "failed" | "retrying" | "done";

export default function ToolRetryExample() {
  const [phase, setPhase] = useState<Phase>("failed");
  const [retryAt, setRetryAt] = useState<string>();

  // The host waits out its backoff, then the call succeeds.
  useEffect(() => {
    if (phase !== "retrying") return;
    const timer = setTimeout(() => setPhase("done"), 5000);
    return () => clearTimeout(timer);
  }, [phase]);

  const call: ToolCall =
    phase === "failed"
      ? { ...base, outcome: "error" }
      : phase === "retrying"
        ? { ...base, retry: { attempt: 2, maxAttempts: 3, retryAt, reason: "Server error 503" } }
        : { ...base, output: { state: "available", value: { status: "ok" } } };

  return (
    <div className="flex flex-col gap-1">
      <Tool
        call={call}
        error={{ message: "Request timed out after 30 s." }}
        defaultOpen
        onRetry={() => {
          setRetryAt(new Date(Date.now() + 5000).toISOString());
          setPhase("retrying");
        }}
      />
      {phase === "done" ? (
        <button
          type="button"
          data-kind-button="secondary"
          className="self-start"
          onClick={() => setPhase("failed")}
        >
          Start over
        </button>
      ) : null}
    </div>
  );
}
