import type { MotionMode, UploadItem } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Uploader } from "../../../../src/react/uploader.js";
import { defineUploader } from "../../../../src/web/uploader.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

defineUploader();

function Mixed({ motion }: { motion: MotionMode | null }) {
  const [items, setItems] = useState<UploadItem[]>(uploads);
  const [{ fixture, ...host }] = useState(() => uploadHost(setItems));
  useEffect(() => {
    Object.assign(window, { kindUploader: fixture });
  }, [fixture]);
  return (
    <div className="mx-auto max-w-lg p-6">
      <Uploader
        aria-label="Uploads"
        items={items}
        maxSize={5_000_000}
        {...(motion ? { motion } : {})}
        {...host}
      />
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

function WebElement() {
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

export const cases = {
  mixed: (params: URLSearchParams) => <Mixed motion={params.get("motion") as MotionMode | null} />,
  "web-element": () => <WebElement />,
};
