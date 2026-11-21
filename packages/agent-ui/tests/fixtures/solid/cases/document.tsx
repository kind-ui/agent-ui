import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Document } from "../../../../src/solid/document.js";
import { chunks, code, downloads, notes, readme } from "../../shared/document.js";
import { expose } from "../../shared/expose.js";

type Recorded = { downloads: [string | undefined, string][] };

const recorded: Recorded = { downloads: [] };

function Page(props: { motion?: MotionMode }) {
  onSettled(() => expose({ kindHost: recorded }));
  return (
    <div class="flex w-[34rem] flex-col gap-4 p-6">
      <Document
        id="readme"
        label="README.md"
        content={readme}
        downloads={downloads}
        onDownload={(id, details) => void recorded.downloads.push([id, details.source])}
        motion={props.motion}
      />
      <Document id="code" label="backoff.ts" format="code" language="ts" content={code} />
      <Document id="notes" label="notes.txt" format="text" content={notes} />
    </div>
  );
}

function Streaming() {
  const [count, setCount] = createSignal(0);
  onSettled(() =>
    expose({ kindHost: { next: () => setCount((current) => Math.min(current + 1, chunks.length)) } }),
  );
  return (
    <div class="w-[34rem] p-6">
      <Document
        id="streaming"
        label="README.md"
        content={chunks.slice(0, count()).join("")}
        streaming={count() < chunks.length}
        onDownload={() => {}}
      />
    </div>
  );
}

function Refused() {
  const openings: string[] = [];
  let settle: { resolve: () => void; reject: () => void } | undefined;
  onSettled(() =>
    expose({
      kindHost: {
        openings,
        resolve: () => settle?.resolve(),
        reject: () => settle?.reject(),
      },
    }),
  );
  return (
    <div class="w-[34rem] p-6">
      <Document
        id="readme"
        label="README.md"
        content={readme}
        open={false}
        onOpenChange={(open, details) => void openings.push(`${open}:${details.reason}`)}
        onDownload={() =>
          new Promise<void>((resolve, reject) => {
            settle = { resolve, reject };
          })
        }
        onCopy={(_content, details) => details.cancel()}
      />
    </div>
  );
}

export const cases = {
  refused: () => <Refused />,
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  streaming: () => <Streaming />,
};
