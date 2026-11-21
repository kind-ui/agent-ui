import { generatedImagePrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/solid/progress";
import { omit } from "solid-js";

const parts = createParts(generatedImagePrimitive, {
  root: "div",
  frame: "div",
  preview: "img",
  progress: "div",
  image: "img",
  error: "div",
  trigger: "button",
  download: "button",
  backdrop: "div",
  content: "div",
  "full-image": "img",
  title: "h2",
  close: "button",
});

export type GeneratedImageProps = ComponentProps<typeof parts.Root>;

/**
 * An image the agent is making: a frame of the image's shape that shows its progress and a blurred preview, then
 * the image, which opens full size. Any `children` replace the frame and the full size view.
 */
export function GeneratedImage(props: GeneratedImageProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <DefaultParts />}</parts.Root>;
}

export type GeneratedImageFrameProps = ComponentProps<typeof parts.Frame>;

/** Keeps the image's shape in every phase. Holds the preview, progress, image, error, trigger and Download. */
export function GeneratedImageFrame(props: GeneratedImageFrameProps) {
  return <parts.Frame {...omit(props, "children")}>{props.children ?? <DefaultFrame />}</parts.Frame>;
}

/** The `preview`, blurred and sharpening with `progress`, while the image is on its way. */
export const GeneratedImagePreview = parts.Preview;

export type GeneratedImageProgressProps = ComponentProps<typeof parts.Progress>;

/**
 * A UI SDK Progress, read as a quiet corner label like "Creating image · 42%" until the image loads, unless you pass
 * children.
 */
export function GeneratedImageProgress(props: GeneratedImageProgressProps) {
  return (
    <parts.Progress {...omit(props, "children")}>
      {props.children ??
        ((state) => (
          <Progress value={state.value}>
            <ProgressLabel>{state.label}</ProgressLabel>
            <ProgressValue />
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        ))}
    </parts.Progress>
  );
}

/** The image at `src`, which fades in once it loads. */
export const GeneratedImageImage = parts.Image;

export type GeneratedImageErrorProps = ComponentProps<typeof parts.Error>;

/** What went wrong, under a muted image glyph, unless you pass children. */
export function GeneratedImageError(props: GeneratedImageErrorProps) {
  return (
    <parts.Error {...omit(props, "children")}>{props.children ?? ((state) => state.message)}</parts.Error>
  );
}

/** "View full size": covers the loaded image and opens it in a dialog. */
export const GeneratedImageTrigger = parts.Trigger;

/** Calls `onDownload`. Rendered while it's set and the image is loaded. */
export const GeneratedImageDownload = parts.Download;

/** Dims the page behind the full size view. */
export const GeneratedImageBackdrop = parts.Backdrop;

export type GeneratedImageDialogProps = ComponentProps<typeof parts.Content>;

/** The full size view: the image, its `alt` as the title, Download and Close, unless you pass children. */
export function GeneratedImageDialog(props: GeneratedImageDialogProps) {
  return <parts.Content {...omit(props, "children")}>{props.children ?? <DefaultDialog />}</parts.Content>;
}

/** The image at full size, inside the dialog. */
export const GeneratedImageFullImage = parts.FullImage;

export type GeneratedImageTitleProps = ComponentProps<typeof parts.Title>;

/** The `alt`, unless you pass children. Names the dialog. */
export function GeneratedImageTitle(props: GeneratedImageTitleProps) {
  return <parts.Title {...omit(props, "children")}>{props.children ?? ((state) => state.alt)}</parts.Title>;
}

export type GeneratedImageCloseProps = ComponentProps<typeof parts.Close>;

/** Closes the dialog and returns focus to the trigger. "Close", unless you pass children. */
export function GeneratedImageClose(props: GeneratedImageCloseProps) {
  return <parts.Close {...omit(props, "children")}>{props.children ?? "Close"}</parts.Close>;
}

function DefaultFrame() {
  return (
    <>
      <GeneratedImagePreview />
      <GeneratedImageImage />
      <GeneratedImageProgress />
      <GeneratedImageError />
      <GeneratedImageTrigger />
      <GeneratedImageDownload />
    </>
  );
}

function DefaultDialog() {
  return (
    <>
      <GeneratedImageFullImage />
      <div data-generated-image-actions="">
        <GeneratedImageTitle />
        <GeneratedImageDownload>Download</GeneratedImageDownload>
        <GeneratedImageClose />
      </div>
    </>
  );
}

function DefaultParts() {
  return (
    <>
      <GeneratedImageFrame />
      <GeneratedImageBackdrop />
      <GeneratedImageDialog />
    </>
  );
}
