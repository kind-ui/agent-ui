import type { GeneratedImageStatus, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { GeneratedImage } from "../../../../src/react/generated-image.js";
import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

type Recorded = { downloads: string[] };

const recorded: Recorded = { downloads: [] };

function Page({ motion }: { motion?: MotionMode }) {
  const [status, setStatus] = useState<GeneratedImageStatus>("generating");
  const [progress, setProgress] = useState<number | undefined>(40);
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        ...recorded,
        progress: setProgress,
        ready: (url?: string) => {
          setSrc(url ?? lighthouse);
          setStatus("ready");
        },
        fail: () => setStatus("error"),
        missing,
      },
    });
  }, []);
  return (
    <div className="flex w-[30rem] flex-col gap-4 p-6">
      <GeneratedImage
        id="lifecycle"
        alt="A lighthouse at night"
        status={status}
        progress={progress}
        preview={preview}
        src={src}
        {...size}
        motion={motion}
      />
      <GeneratedImage
        id="loaded"
        alt="A lighthouse at dusk"
        src={lighthouse}
        {...size}
        onDownload={(details) => void recorded.downloads.push(details.source)}
        motion={motion}
      />
      <GeneratedImage
        id="failed"
        alt="A lighthouse in a storm"
        status="error"
        error="Generation timed out."
        {...size}
        motion={motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
};
