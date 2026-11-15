import type { UploadItem } from "@kind-ui/agent-ui/core";
import { useState } from "react";
import { Uploader } from "../../../../src/react/uploader.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

function Mixed() {
  const [items, setItems] = useState<UploadItem[]>(uploads);
  const [host] = useState(() => uploadHost(setItems));
  return (
    <div className="mx-auto max-w-lg p-6">
      <Uploader aria-label="Uploads" items={items} maxSize={5_000_000} {...host} />
    </div>
  );
}

export const cases = { mixed: () => <Mixed /> };
