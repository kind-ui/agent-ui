import {
  type MotionMode,
  type UploaderListState,
  type UploaderOptions,
  type UploaderRootState,
  type UploadItem,
  type UploadItemState,
  uploaderPrimitive,
} from "@kind-ui/agent-ui/core";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/vue/file-input";
import { createParts, type PartSlots, usePart, usePrimitive } from "@ui-sdk/vue/primitive";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/vue/progress";
import { defineComponent, h, type PropType } from "vue";

const parts = createParts(uploaderPrimitive, { list: "ul", item: "li", action: "button" });

/** One upload: the file's name and progress bar, what it's doing, and its action. */
export const UploaderItem = defineComponent({
  name: "UploaderItem",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        parts.Item,
        { ...attrs, value: props.value },
        {
          ...slots,
          default: ({ state: { item, detail } }: { state: UploadItemState }) => [
            h("span", { "data-icon": "" }),
            h(Progress, { value: item?.progress ?? null }, () => [
              h(ProgressLabel, null, () => item?.name),
              h(ProgressTrack, null, () => h(ProgressIndicator)),
            ]),
            h("span", { "data-detail": "" }, detail),
            h(parts.Action, { value: props.value }),
          ],
        },
      );
  },
});

const rows = ({ state }: { state: UploaderListState }) =>
  state.rows.map((row) => h(UploaderItem, { key: row.item.id, value: row.item.id }));

/**
 * A File Input drop zone with a Browse button, then a row per item with its progress, and Cancel or Retry while the
 * host listens to `cancel` or `retry`. Name it with `aria-label`.
 */
// Written by hand rather than as `createParts`' root, which passes every callback to the primitive whether anyone
// listens or not: `onCancel` and `onRetry` are props, so they reach it only when `@cancel` and `@retry` are bound.
export const Uploader = defineComponent({
  name: "Uploader",
  inheritAttrs: false,
  props: {
    items: Array as PropType<readonly UploadItem[]>,
    accept: String,
    maxSize: Number,
    motion: String as PropType<MotionMode>,
    onCancel: Function as PropType<UploaderOptions["onCancel"]>,
    onRetry: Function as PropType<UploaderOptions["onRetry"]>,
  },
  emits: {
    files: (..._args: Parameters<NonNullable<UploaderOptions["onFiles"]>>) => true,
    reject: (..._args: Parameters<NonNullable<UploaderOptions["onReject"]>>) => true,
  },
  slots: Object as PartSlots<typeof uploaderPrimitive, "root">,
  setup(props, { emit }) {
    const handle = usePrimitive(uploaderPrimitive, () => ({
      items: props.items,
      accept: props.accept,
      maxSize: props.maxSize,
      motion: props.motion,
      onCancel: props.onCancel,
      onRetry: props.onRetry,
      onFiles: (files, details) => emit("files", files, details),
      onReject: (rejected, details) => emit("reject", rejected, details),
    }));
    return usePart(handle, "root", undefined, undefined, {
      tag: "div",
      children: ({ fileInput }: UploaderRootState) => [
        h(FileInput, fileInput, () =>
          h(FileInputDropzone, null, () => [
            h("span", { "data-upload-icon": "" }),
            h("span", { "data-hint": "" }, "Drop files here, or"),
            h(FileInputTrigger, null, () => "browse"),
          ]),
        ),
        h(parts.List, null, { default: rows }),
      ],
    });
  },
});
