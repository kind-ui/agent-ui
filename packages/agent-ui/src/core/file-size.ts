import { formatFileSize } from "@ui-sdk/core/file-input";

const BYTES = new Intl.NumberFormat("en", {
  style: "unit",
  unit: "byte",
  unitDisplay: "long",
  maximumFractionDigits: 0,
});

/**
 * A file's size in English, like "812 bytes" or "3.1 MB", so a server and a browser agree. UI SDK's
 * `formatFileSize` says "812 byte" under 1 kB.
 */
export const fileSize = (bytes: number): string =>
  Math.round(bytes) < 1000 ? BYTES.format(bytes) : formatFileSize(bytes, "en");
