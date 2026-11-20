"use client";
import { useState } from "react";
import { Notice } from "@/components/ui/notice";

export default function NoticeExample() {
  const [rateLimited, setRateLimited] = useState(true);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Notice label="Indexing your files">Answers may miss files added in the last minute.</Notice>
      <Notice variant="success" label="Connected to GitHub">
        The assistant can read your repositories now.
      </Notice>
      {rateLimited ? (
        <Notice variant="warning" label="Rate limited" onDismiss={() => setRateLimited(false)}>
          Responses are slower for the next few minutes.
        </Notice>
      ) : (
        <button
          type="button"
          data-kind-button="secondary"
          className="self-start"
          onClick={() => setRateLimited(true)}
        >
          Show the warning again
        </button>
      )}
      <Notice
        variant="error"
        label="Couldn't reach the model"
        actions={
          <button type="button" data-kind-button="secondary">
            Retry
          </button>
        }
      >
        Check your connection and try again.
      </Notice>
    </div>
  );
}
