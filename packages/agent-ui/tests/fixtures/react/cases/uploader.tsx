import type { UploadItem } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Uploader } from "../../../../src/react/uploader.js";
import { defineUploader } from "../../../../src/web/uploader.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

function Mixed() {
  const [items, setItems] = useState<UploadItem[]>(uploads);
  const [{ fixture, ...host }] = useState(() => uploadHost(setItems));
  useEffect(() => {
    Object.assign(window, { kindUploader: fixture });
  }, [fixture]);
  return (
    <div className="mx-auto max-w-lg p-6">
      <Uploader aria-label="Uploads" items={items} maxSize={5_000_000} {...host} />
    </div>
  );
}

type UploaderElementProps = {
  "aria-label": string;
  items: UploadItem[];
  canCancel?: boolean;
  canRetry?: boolean;
  onuploadcancel?: (event: CustomEvent<{ value: string }>) => void;
  onuploadretry?: (event: CustomEvent<{ value: string }>) => void;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "kind-uploader": UploaderElementProps;
    }
  }
}

// React 19 sets a custom element's properties and listens to `on<event>` props as its events.
function WebElement() {
  defineUploader();
  const [items, setItems] = useState<UploadItem[]>(uploads);
  const [{ fixture, onCancel, onRetry }] = useState(() => uploadHost(setItems));
  useEffect(() => {
    Object.assign(window, { kindUploader: fixture });
  }, [fixture]);
  return (
    <div className="mx-auto max-w-lg p-6">
      <kind-uploader
        aria-label="Uploads"
        items={items}
        canCancel
        canRetry
        onuploadcancel={(event) => onCancel(event.detail.value)}
        onuploadretry={(event) => onRetry(event.detail.value)}
      />
    </div>
  );
}

export const cases = { mixed: () => <Mixed />, "web-element": () => <WebElement /> };
