import type { ComponentProps } from "svelte";
import Document from "./Document.svelte";
import DocumentBody from "./DocumentBody.svelte";
import DocumentContent from "./DocumentContent.svelte";
import DocumentCopy from "./DocumentCopy.svelte";
import DocumentDownload from "./DocumentDownload.svelte";
import DocumentExpand from "./DocumentExpand.svelte";
import DocumentMeta from "./DocumentMeta.svelte";
import DocumentTitle from "./DocumentTitle.svelte";
import DocumentToolbar from "./DocumentToolbar.svelte";
import { parts } from "./parts.js";

/** Holds the title, the meta line and the toolbar. */
export const DocumentHeader = parts.Header;

export {
  Document,
  DocumentBody,
  DocumentContent,
  DocumentCopy,
  DocumentDownload,
  DocumentExpand,
  DocumentMeta,
  DocumentTitle,
  DocumentToolbar,
};

export type DocumentProps = ComponentProps<typeof Document>;
export type DocumentTitleProps = ComponentProps<typeof DocumentTitle>;
export type DocumentMetaProps = ComponentProps<typeof DocumentMeta>;
export type DocumentToolbarProps = ComponentProps<typeof DocumentToolbar>;
export type DocumentCopyProps = ComponentProps<typeof DocumentCopy>;
export type DocumentDownloadProps = ComponentProps<typeof DocumentDownload>;
export type DocumentBodyProps = ComponentProps<typeof DocumentBody>;
export type DocumentContentProps = ComponentProps<typeof DocumentContent>;
export type DocumentExpandProps = ComponentProps<typeof DocumentExpand>;
