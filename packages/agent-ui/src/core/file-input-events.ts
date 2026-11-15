import type { FileInputValueChangeReason, FileRejection } from "@ui-sdk/core/file-input";

/** What a composer or uploader does with files File Input took in or turned down. */
export type FileIntake = {
  accept: (files: File[], reason: FileInputValueChangeReason, cancel: () => void) => void;
  reject: (rejected: FileRejection[], reason: FileInputValueChangeReason) => void;
};

type Detail<Value> = { value: Value; added: File[]; reason: FileInputValueChangeReason };

/**
 * Hands `<ui-file-input>`'s `valuechange` and `reject` events to `intake`, as React's props do.
 * `@ui-sdk/web` fires them on the file input alone, without bubbling, so `container` hears them as they capture.
 */
export function forwardFileInputEvents(container: HTMLElement, intake: FileIntake): () => void {
  const fromFileInput = (event: Event) => (event.target as Element).localName === "ui-file-input";
  const valueChange = (event: Event) => {
    if (!fromFileInput(event)) return;
    const { added, reason } = (event as CustomEvent<Detail<File[]>>).detail;
    intake.accept(added, reason, () => event.preventDefault());
  };
  const reject = (event: Event) => {
    if (!fromFileInput(event)) return;
    const { value, reason } = (event as CustomEvent<Detail<FileRejection[]>>).detail;
    intake.reject(value, reason);
  };
  container.addEventListener("valuechange", valueChange, true);
  container.addEventListener("reject", reject, true);
  return () => {
    container.removeEventListener("valuechange", valueChange, true);
    container.removeEventListener("reject", reject, true);
  };
}
