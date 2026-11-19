import { formatFileSize } from "@ui-sdk/core/file-input";

const BYTES = new Intl.NumberFormat("en", { style: "unit", unit: "byte", unitDisplay: "long" });

/** A file's size, like "812 bytes" or "3.1 MB". UI SDK's `formatFileSize` says "812 byte" under 1 kB. */
export const fileSize = (bytes: number): string =>
  bytes < 1000 ? BYTES.format(bytes) : formatFileSize(bytes);
