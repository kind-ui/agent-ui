import {
  type UploaderListState,
  type UploaderRootState,
  type UploadItemState,
  uploaderPrimitive,
} from "@kind-ui/agent-ui/core";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/vue/file-input";
import { createParts } from "@ui-sdk/vue/primitive";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/vue/progress";
import { defineComponent, h } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onCancel` and `onRetry`, whose presence offers Cancel and Retry, are declared function props instead, which
// `@cancel` and `@retry` bind. `@files` and `@reject` stay events.
const primitive = Object.defineProperty(
  Object.assign((options: never) => uploaderPrimitive(options), uploaderPrimitive, {
    options: { ...uploaderPrimitive.options, onCancel: "action", onRetry: "action" },
  }),
  "name",
  { value: uploaderPrimitive.name },
) as typeof uploaderPrimitive;

const parts = createParts(primitive, { root: "div", list: "ul", item: "li", action: "button" });

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

const children = ({ state: { fileInput } }: { state: UploaderRootState }) => [
  h(FileInput, fileInput, () =>
    h(FileInputDropzone, null, () => [
      h("span", { "data-upload-icon": "" }),
      h("span", { "data-hint": "" }, "Drop files here, or"),
      h(FileInputTrigger, null, () => "browse"),
    ]),
  ),
  h(parts.List, null, { default: rows }),
];

/**
 * A File Input drop zone with a Browse button, then a row per item with its progress, and Cancel or Retry while the
 * host listens to `cancel` or `retry`. Name it with `aria-label`.
 */
export const Uploader = defineComponent({
  name: "Uploader",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: children });
  },
}) as unknown as typeof parts.Root;
