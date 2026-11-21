import { h } from "vue";
import { Uploader } from "../components/ui/vue/uploader.js";

export default () =>
  h(Uploader, {
    "aria-label": "Uploads",
    items: [{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }],
  });
