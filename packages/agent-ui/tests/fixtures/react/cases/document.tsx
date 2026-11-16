import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Document } from "../../../../src/react/document.js";
import { chunks, code, downloads, notes, readme } from "../../shared/document.js";

type Recorded = { downloads: [string | undefined, string][] };

const recorded: Recorded = { downloads: [] };

function Page({ motion }: { motion?: MotionMode }) {
  useEffect(() => {
    Object.assign(window, { kindHost: recorded });
  }, []);
  return (
    <div className="flex w-[34rem] flex-col gap-4 p-6">
      <Document
        id="readme"
        label="README.md"
        content={readme}
        downloads={downloads}
        onDownload={(id, details) => void recorded.downloads.push([id, details.source])}
        motion={motion}
      />
      <Document id="code" label="backoff.ts" format="code" language="ts" content={code} />
      <Document id="notes" label="notes.txt" format="text" content={notes} />
    </div>
  );
}

function Streaming() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    Object.assign(window, {
      kindHost: { next: () => setCount((current) => Math.min(current + 1, chunks.length)) },
    });
  }, []);
  return (
    <div className="w-[34rem] p-6">
      <Document
        id="streaming"
        label="README.md"
        content={chunks.slice(0, count).join("")}
        streaming={count < chunks.length}
        onDownload={() => {}}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  streaming: () => <Streaming />,
};
