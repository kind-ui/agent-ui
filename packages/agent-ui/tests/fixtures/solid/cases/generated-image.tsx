import type { GeneratedImageStatus, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { GeneratedImage } from "../../../../src/solid/generated-image.js";
import { expose } from "../../shared/expose.js";
import { lighthouse, missing, preview, size } from "../../shared/generated-image.js";

type Settle = { resolve(): void; reject(): void };

const recorded: { downloads: string[]; settle?: Settle } = { downloads: [] };

function Page(props: { motion?: MotionMode }) {
  const [status, setStatus] = createSignal<GeneratedImageStatus>("generating");
  const [progress, setProgress] = createSignal<number | undefined>(40);
  const [src, setSrc] = createSignal<string>();
  const [previewUrl, setPreviewUrl] = createSignal<string | undefined>(preview);
  onSettled(() =>
    expose({
      kindHost: {
        downloads: recorded.downloads,
        resolve: () => recorded.settle?.resolve(),
        reject: () => recorded.settle?.reject(),
        progress: (value: number | undefined) => setProgress(value),
        preview: (show: boolean) => setPreviewUrl(show ? preview : undefined),
        ready: (url: string) => {
          setSrc(url);
          setStatus("ready");
        },
        fail: () => setStatus("error"),
        generate: () => setStatus("generating"),
        missing,
      },
    }),
  );
  return (
    <div class="flex w-[30rem] flex-col gap-4 p-6">
      <GeneratedImage
        id="lifecycle"
        alt="A lighthouse at night"
        status={status()}
        progress={progress()}
        preview={previewUrl()}
        src={src()}
        {...size}
        motion={props.motion}
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
        motion={props.motion}
      />
      <GeneratedImage
        id="failed"
        alt="A lighthouse in a storm"
        status="error"
        error="Generation timed out."
        {...size}
        motion={props.motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
};
