import type { MotionMode, UploadItem } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Uploader } from "../../../../src/solid/uploader.js";
import { expose } from "../../shared/expose.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

function Mixed(props: { motion: MotionMode | null }) {
  const [items, setItems] = createSignal<readonly UploadItem[]>(uploads);
  const { fixture, ...host } = uploadHost((change) => setItems((current) => change(current)));
  onSettled(() => expose({ kindUploader: fixture }));
  return (
    <div class="mx-auto max-w-lg p-6">
      <Uploader
        aria-label="Uploads"
        items={items()}
        maxSize={5_000_000}
        motion={props.motion ?? undefined}
        {...host}
      />
    </div>
  );
}

export const cases = {
  mixed: (params: URLSearchParams) => <Mixed motion={params.get("motion") as MotionMode | null} />,
};
