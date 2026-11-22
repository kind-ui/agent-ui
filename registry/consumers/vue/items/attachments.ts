import { h } from "vue";
import { Attachments } from "../components/ui/vue/attachments.js";

export default () =>
  h(Attachments, {
    "aria-label": "Files",
    items: [{ id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" }],
  });
