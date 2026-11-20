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

/** Which glyph a file gets, written as `data-file-kind`. */
export type FileKind = "image" | "audio" | "video" | "archive" | "spreadsheet" | "code" | "text" | "file";

const BY_EXTENSION: Record<string, FileKind> = {};
for (const [kind, extensions] of [
  ["archive", "zip gz tar rar 7z"],
  ["spreadsheet", "csv tsv xls xlsx"],
  ["code", "js ts tsx jsx json py rb go rs java c cpp sh html css yaml sql"],
  ["text", "txt md pdf doc docx rtf"],
  ["image", "png jpg jpeg gif webp svg heic"],
  ["audio", "mp3 wav m4a ogg flac"],
  ["video", "mp4 mov webm"],
] as const) {
  for (const extension of extensions.split(" ")) BY_EXTENSION[extension] = kind;
}

/** A file's extension, like "pdf", or `""` for a name without one. */
export const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
};

/** The file's kind, from its media type, else its extension. */
export function fileKind(name: string, mediaType?: string): FileKind {
  const family = mediaType?.split("/")[0];
  if (family === "image" || family === "audio" || family === "video") return family;
  return BY_EXTENSION[fileExtension(name)] ?? (family === "text" ? "text" : "file");
}
