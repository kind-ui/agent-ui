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
  ["archive", "zip gz tgz tar rar 7z bz2 xz"],
  ["spreadsheet", "csv tsv xls xlsx ods numbers"],
  [
    "code",
    "js mjs cjs ts tsx jsx json py rb go rs java kt swift c h cpp cs php sh html css scss xml yaml yml toml sql",
  ],
  ["text", "txt md mdx pdf doc docx rtf odt pages log"],
  ["image", "png jpg jpeg gif webp avif svg heic bmp ico"],
  ["audio", "mp3 wav m4a aac ogg flac"],
  ["video", "mp4 mov webm mkv avi"],
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
