import {
  type AttachmentState,
  type AttachmentsOptions,
  type AttachmentsRootState,
  attachmentsPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, usePart, usePrimitive } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type PropType } from "vue";

const parts = createParts(attachmentsPrimitive, { root: "ul", item: "li", remove: "span" });

// The generated root always hands the primitive an `onRemove` that emits `remove`, so chips would stay removable
// without a listener. This root passes `onRemove` only while the host listens, as React's does.
const Root = defineComponent({
  name: "AttachmentsRoot",
  inheritAttrs: false,
  props: {
    items: Array as PropType<AttachmentsOptions["items"]>,
    onRemove: Function as PropType<NonNullable<AttachmentsOptions["onRemove"]>>,
    focusFallback: Function as PropType<AttachmentsOptions["focusFallback"]>,
    motion: String as PropType<AttachmentsOptions["motion"]>,
  },
  setup(props, { attrs }) {
    const handle = usePrimitive(attachmentsPrimitive, () => ({
      items: props.items,
      onRemove: props.onRemove,
      focusFallback: props.focusFallback,
      motion: props.motion,
    }));
    return usePart(handle, "root", undefined, () => attrs, "ul");
  },
});

/** One chip: an image's preview or a file icon, the name, the size or error, and a remove button. */
export const Attachment = defineComponent({
  name: "Attachment",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  setup(props, { attrs }) {
    return () =>
      h(
        parts.Item,
        { ...attrs, value: props.value },
        {
          default: ({ state }: { state: AttachmentState }) => [
            state.preview
              ? h("img", { "data-preview": "", src: state.preview, alt: "" })
              : h("span", { "data-icon": "" }),
            h("span", { "data-name": "" }, state.item?.name),
            h("span", { "data-detail": "" }, state.detail),
            h(parts.Remove, { value: props.value }),
          ],
        },
      );
  },
});

const rows = ({ state }: { state: AttachmentsRootState }) =>
  state.rows.map((row) => h(Attachment, { key: row.item.id, value: row.item.id }));

/**
 * The `items` as chips, one Tab stop with arrow keys between them. Name it with `aria-label`. Without a default slot,
 * each of its `rows` gets an `Attachment`, so a removed chip fades out. To style the chips, give it a default slot of
 * `{ state }` that renders an `Attachment` per `state.rows` entry, with the item's `id` as its `value`; chips rendered
 * from `items` instead leave at once.
 */
export const Attachments = defineComponent({
  name: "Attachments",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(Root, attrs, { default: slots.default ?? rows });
  },
}) as unknown as typeof parts.Root;
