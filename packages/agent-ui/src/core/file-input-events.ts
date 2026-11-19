import type { FileInputValueChangeReason, FileRejection } from "@ui-sdk/core/file-input";
import { hearComposed } from "./composed-events.js";

/** What a composer or uploader does with files File Input took in or turned down. */
export type FileIntake = {
  accept: (files: File[], reason: FileInputValueChangeReason, cancel: () => void) => void;
  reject: (rejected: FileRejection[], reason: FileInputValueChangeReason) => void;
};

type Detail<Value> = { value: Value; added: File[]; reason: FileInputValueChangeReason };

const fromFileInput = (event: Event) => (event.target as Element).localName === "ui-file-input";

/** Hands `<ui-file-input>`'s `valuechange` and `reject` events to `intake`, as React's props do. */
export function forwardFileInputEvents(container: HTMLElement, intake: FileIntake): () => void {
  return hearComposed(container, {
    valuechange: (detail, event) => {
      if (!fromFileInput(event)) return;
      const { added, reason } = detail as Detail<File[]>;
      intake.accept(added, reason, () => event.preventDefault());
    },
    reject: (detail, event) => {
      if (!fromFileInput(event)) return;
      const { value, reason } = detail as Detail<FileRejection[]>;
      intake.reject(value, reason);
    },
  });
}
