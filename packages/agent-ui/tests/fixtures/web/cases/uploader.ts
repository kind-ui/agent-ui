import { defineUploader, type KindUploaderElement } from "../../../../src/web/uploader.js";
import { uploadHost, uploads } from "../../shared/uploader.js";

export const cases = {
  mixed: (root: HTMLElement) => {
    defineUploader();
    root.innerHTML = `<div class="mx-auto max-w-lg p-6"><kind-uploader aria-label="Uploads" max-size="5000000" can-cancel can-retry></kind-uploader></div>`;
    const uploader = root.querySelector("kind-uploader") as KindUploaderElement;
    uploader.items = uploads;
    const { fixture, onFiles, onReject, onCancel, onRetry } = uploadHost((change) => {
      uploader.items = change(uploader.items ?? []);
    });
    Object.assign(window, { kindUploader: fixture });
    uploader.addEventListener("files", (event) =>
      onFiles((event as CustomEvent<{ value: File[] }>).detail.value),
    );
    uploader.addEventListener("uploadreject", (event) =>
      onReject((event as CustomEvent<{ value: { file: File }[] }>).detail.value),
    );
    uploader.addEventListener("uploadcancel", (event) =>
      onCancel((event as CustomEvent<{ value: string }>).detail.value),
    );
    uploader.addEventListener("uploadretry", (event) =>
      onRetry((event as CustomEvent<{ value: string }>).detail.value),
    );
  },
};
