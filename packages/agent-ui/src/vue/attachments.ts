import {
  type AttachmentState,
  type AttachmentsRootState,
  attachmentsPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onRemove`, whose presence makes the chips removable, is declared a function prop instead, which `@remove` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => attachmentsPrimitive(options), attachmentsPrimitive, {
    options: { ...attachmentsPrimitive.options, onRemove: "action" },
  }),
  "name",
  { value: attachmentsPrimitive.name },
) as typeof attachmentsPrimitive;

const parts = createParts(primitive, { root: "ul", item: "li", remove: "span" });

/** One chip: an image's preview or a file icon, the name, the size or error, and a remove button. */
export const Attachment = defineComponent({
  name: "Attachment",
  inheritAttrs: false,
  props: { value: { type: String, required: true } },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        parts.Item,
        { ...attrs, value: props.value },
        {
          ...slots,
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
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? rows });
  },
}) as unknown as typeof parts.Root;
