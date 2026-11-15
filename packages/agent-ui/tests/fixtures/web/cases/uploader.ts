import type { UploadItem } from "@kind-ui/agent-ui/core";
import { defineUploader } from "../../../../src/web/uploader.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

export const cases = {
  mixed: (root: HTMLElement) => {
    defineUploader();
    root.innerHTML = `<div class="mx-auto max-w-lg p-6"><kind-uploader aria-label="Uploads" max-size="5000000"></kind-uploader></div>`;
    const uploader = root.querySelector("kind-uploader") as HTMLElement & { items: UploadItem[] };
    uploader.items = uploads;
    const { onFiles, onReject, onCancel, onRetry } = uploadHost((change) => {
      uploader.items = change(uploader.items);
    });
    Object.assign(uploader, { onCancel, onRetry });
    uploader.addEventListener("files", (event) =>
      onFiles((event as CustomEvent<{ value: File[] }>).detail.value),
    );
    uploader.addEventListener("reject", (event) =>
      onReject((event as CustomEvent<{ value: { file: File }[] }>).detail.value),
    );
  },
};
