import { Attachments } from "../components/ui/solid/attachments.js";

export default function AttachmentsItem() {
  return (
    <Attachments
      aria-label="Files"
      items={[{ id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" }]}
    />
  );
}
