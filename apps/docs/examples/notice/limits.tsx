"use client";
import { useEffect, useState } from "react";
import { Notice } from "@/components/ui/notice";

const HOUR = 3_600_000;

export default function NoticeLimitsExample() {
  // Resets are relative to now, which only the browser knows, so the server renders the notices without them.
  const [now, setNow] = useState<number>();
  useEffect(() => setNow(Date.now()), []);
  const at = (hours: number) => (now === undefined ? undefined : new Date(now + hours * HOUR).toISOString());
  const [warned, setWarned] = useState(true);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {warned ? (
        <Notice
          variant="warning"
          label="12 requests left"
          resetsAt={at(76)}
          onDismiss={() => setWarned(false)}
          actions={
            <button type="button" data-kind-button="secondary">
              Upgrade
            </button>
          }
        >
          You've used most of this week's requests.
        </Notice>
      ) : (
        <button
          type="button"
          data-kind-button="secondary"
          className="self-start"
          onClick={() => setWarned(true)}
        >
          Show the warning again
        </button>
      )}
      <Notice
        variant="error"
        label="You've reached your weekly limit"
        resetsAt={at(0.7)}
        actions={
          <>
            <button type="button" data-kind-button="secondary">
              Continue at reset
            </button>
            <button type="button" data-kind-button="secondary">
              Switch to Claude Sonnet 5.5
            </button>
            <button type="button" data-kind-button="primary">
              Use credits
            </button>
          </>
        }
      >
        New runs pause until then.
      </Notice>
    </div>
  );
}
