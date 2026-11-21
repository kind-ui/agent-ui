import type { ComponentProps } from "svelte";
import GeneratedImage from "./GeneratedImage.svelte";
import GeneratedImageClose from "./GeneratedImageClose.svelte";
import GeneratedImageDialog from "./GeneratedImageDialog.svelte";
import GeneratedImageError from "./GeneratedImageError.svelte";
import GeneratedImageFrame from "./GeneratedImageFrame.svelte";
import GeneratedImageProgress from "./GeneratedImageProgress.svelte";
import GeneratedImageTitle from "./GeneratedImageTitle.svelte";
import { parts } from "./parts.js";

/** The `preview`, blurred and sharpening with `progress`, while the image is on its way. */
export const GeneratedImagePreview = parts.Preview;
/** The image at `src`, which fades in once it loads. */
export const GeneratedImageImage = parts.Image;
/** "View full size": covers the loaded image and opens it in a dialog. */
export const GeneratedImageTrigger = parts.Trigger;
/** Calls `onDownload`. Rendered while it's set and the image is loaded. */
export const GeneratedImageDownload = parts.Download;
/** Dims the page behind the full size view. */
export const GeneratedImageBackdrop = parts.Backdrop;
/** The image at full size, inside the dialog. */
export const GeneratedImageFullImage = parts.FullImage;

export {
  GeneratedImage,
  GeneratedImageClose,
  GeneratedImageDialog,
  GeneratedImageError,
  GeneratedImageFrame,
  GeneratedImageProgress,
  GeneratedImageTitle,
};

export type GeneratedImageProps = ComponentProps<typeof GeneratedImage>;
export type GeneratedImageFrameProps = ComponentProps<typeof GeneratedImageFrame>;
export type GeneratedImageProgressProps = ComponentProps<typeof GeneratedImageProgress>;
export type GeneratedImageErrorProps = ComponentProps<typeof GeneratedImageError>;
export type GeneratedImageDialogProps = ComponentProps<typeof GeneratedImageDialog>;
export type GeneratedImageTitleProps = ComponentProps<typeof GeneratedImageTitle>;
export type GeneratedImageCloseProps = ComponentProps<typeof GeneratedImageClose>;
