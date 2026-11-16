import { type AttachmentsRootState, attachmentsPrimitive } from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactNode } from "react";

const parts = createParts(attachmentsPrimitive, { root: "ul", item: "li", remove: "span" });

export type AttachmentsProps = Omit<ComponentProps<typeof parts.Root>, "children"> & { children?: ReactNode };

/**
 * The `items` as chips, one Tab stop with arrow keys between them. Name it with `aria-label`. Pass an `Attachment`
 * per item as children to style them; without children, each item gets one, and a removed one fades out.
 */
export function Attachments({ children, ...props }: AttachmentsProps) {
  return <parts.Root {...props}>{children ?? ROWS}</parts.Root>;
}

const ROWS = ({ rows }: AttachmentsRootState) =>
  rows.map((row) => <Attachment key={row.item.id} value={row.item.id} />);

/** One chip: an image's preview or a file icon, the name, the size or error, and a remove button. */
export function Attachment(props: Omit<ComponentProps<typeof parts.Item>, "children">) {
  return (
    <parts.Item {...props}>
      {({ item, preview, detail }) => (
        <>
          {preview ? <img data-preview="" src={preview} alt="" /> : <span data-icon="" />}
          <span data-name="">{item?.name}</span>
          <span data-detail="">{detail}</span>
          <parts.Remove value={props.value} />
        </>
      )}
    </parts.Item>
  );
}
