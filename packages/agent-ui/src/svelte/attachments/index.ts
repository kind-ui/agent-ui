import type { ComponentProps } from "svelte";
import Attachment from "./Attachment.svelte";
import Attachments from "./Attachments.svelte";

export { Attachment, Attachments };
export type AttachmentsProps = ComponentProps<typeof Attachments>;
