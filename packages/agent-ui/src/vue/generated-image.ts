import { generatedImagePrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/vue/progress";
import { type Component, defineComponent, h, type Slot, type Slots, type VNode } from "vue";

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

// A part whose default slot falls back to content built from its state.
function withDefault<C extends Component, State>(part: C, name: string, fallback: (state: State) => unknown) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const fill: Slot = ({ state }) => fallback(state) as VNode[];
      return () => h(part, attrs, { ...slots, default: slots.default ?? fill } as Slots);
    },
  }) as unknown as C;
}

/** The `preview`, blurred and sharpening with `progress`, while the image is on its way. */
export const GeneratedImagePreview = parts.Preview;

/**
 * A UI SDK Progress, read as a quiet corner label like "Creating image · 42%" until the image loads, unless you fill
 * the default slot.
 */
export const GeneratedImageProgress = withDefault(
  parts.Progress,
  "GeneratedImageProgress",
  (state: { value: number | null; label: string }) => {
    const { value, label } = state;
    return h(Progress, { value }, () => [
      h(ProgressLabel, null, () => label),
      h(ProgressValue),
      h(ProgressTrack, null, () => h(ProgressIndicator)),
    ]);
  },
);

/** The image at `src`, which fades in once it loads. */
export const GeneratedImageImage = parts.Image;

/** What went wrong, under a muted image glyph, unless you fill the default slot. */
export const GeneratedImageError = withDefault(
  parts.Error,
  "GeneratedImageError",
  (state: { message: string | undefined }) => state.message,
);

/** "View full size": covers the loaded image and opens it in a dialog. */
export const GeneratedImageTrigger = parts.Trigger;

/** Calls `onDownload`. Rendered while it's set and the image is loaded. */
export const GeneratedImageDownload = parts.Download;

/** Dims the page behind the full size view. */
export const GeneratedImageBackdrop = parts.Backdrop;

/** The image at full size, inside the dialog. */
export const GeneratedImageFullImage = parts.FullImage;

/** The `alt`, unless you fill the default slot. Names the dialog. */
export const GeneratedImageTitle = withDefault(
  parts.Title,
  "GeneratedImageTitle",
  (state: { alt: string }) => state.alt,
);

/** Closes the dialog and returns focus to the trigger. "Close", unless you fill the default slot. */
export const GeneratedImageClose = withDefault(parts.Close, "GeneratedImageClose", () => "Close");

/** Keeps the image's shape in every phase. Holds the preview, progress, image, error, trigger and Download. */
export const GeneratedImageFrame = withDefault(parts.Frame, "GeneratedImageFrame", () => [
  h(GeneratedImagePreview),
  h(GeneratedImageImage),
  h(GeneratedImageProgress),
  h(GeneratedImageError),
  h(GeneratedImageTrigger),
  h(GeneratedImageDownload),
]);

/** The full size view: the image, its `alt` as the title, Download and Close, unless you fill the default slot. */
export const GeneratedImageDialog = withDefault(parts.Content, "GeneratedImageDialog", () => [
  h(GeneratedImageFullImage),
  h("div", { "data-generated-image-actions": "" }, [
    h(GeneratedImageTitle),
    h(GeneratedImageDownload, null, () => "Download"),
    h(GeneratedImageClose),
  ]),
]);

/**
 * An image the agent is making: a frame of the image's shape that shows its progress and a blurred preview, then
 * the image, which opens full size. A filled default slot replaces the frame and the full size view.
 */
export const GeneratedImage = withDefault(parts.Root, "GeneratedImage", () => [
  h(GeneratedImageFrame),
  h(GeneratedImageBackdrop),
  h(GeneratedImageDialog),
]);
