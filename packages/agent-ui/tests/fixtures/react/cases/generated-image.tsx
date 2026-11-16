import type { GeneratedImageStatus, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { GeneratedImage } from "../../../../src/react/generated-image.js";
import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

type Settle = { resolve(): void; reject(): void };

const recorded: { downloads: string[]; settle?: Settle } = { downloads: [] };

function Page({ motion }: { motion?: MotionMode }) {
  const [status, setStatus] = useState<GeneratedImageStatus>("generating");
  const [progress, setProgress] = useState<number | undefined>(40);
  const [src, setSrc] = useState<string>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(preview);
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        downloads: recorded.downloads,
        resolve: () => recorded.settle?.resolve(),
        reject: () => recorded.settle?.reject(),
        progress: setProgress,
        preview: (show: boolean) => setPreviewUrl(show ? preview : undefined),
        ready: (url: string) => {
          setSrc(url);
          setStatus("ready");
        },
        fail: () => setStatus("error"),
        generate: () => setStatus("generating"),
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
        preview={previewUrl}
        src={src}
        {...size}
        motion={motion}
      />
      <GeneratedImage
        id="loaded"
        alt="A lighthouse at dusk"
        src={lighthouse}
        {...size}
        onDownload={(details) => {
          recorded.downloads.push(details.source);
          return new Promise<void>((resolve, reject) => {
            recorded.settle = { resolve, reject };
          });
        }}
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
