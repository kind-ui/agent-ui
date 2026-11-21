import { type AttachmentsRootState, attachmentsPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";

const parts = createParts(attachmentsPrimitive, { root: "ul", item: "li", remove: "span" });

export type AttachmentsProps = ComponentProps<typeof parts.Root>;

/**
 * The `items` as chips, one Tab stop with arrow keys between them. Name it with `aria-label`. Without children, each
 * of its `rows` gets an `Attachment`, so a removed chip fades out. To style the chips, pass a function of `{ rows }`
 * that renders an `Attachment` per row, with the item's `id` as its `value`; chips rendered from `items` instead
 * leave at once.
 */
export function Attachments(props: AttachmentsProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? ROWS}</parts.Root>;
}

const ROWS = (state: AttachmentsRootState) => (
  <For each={state.rows} keyed={(row) => row.item.id}>
    {(row) => <Attachment value={row().item.id} />}
  </For>
);

/** One chip: an image's preview or a file icon, the name, the size or error, and a remove button. */
export function Attachment(props: Omit<ComponentProps<typeof parts.Item>, "children">) {
  return (
    <parts.Item {...props}>
      {(state) => (
        <>
          <Show when={state.preview} fallback={<span data-icon="" />}>
            <img data-preview="" src={state.preview} alt="" />
          </Show>
          <span data-name="">{state.item?.name}</span>
          <span data-detail="">{state.detail}</span>
          <parts.Remove value={props.value} />
        </>
      )}
    </parts.Item>
  );
}
