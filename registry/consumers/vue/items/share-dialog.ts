import { h } from "vue";
import { ShareDialog } from "../components/ui/vue/share-dialog.js";

export default () => h(ShareDialog, { link: "https://example.com/s/abc", defaultVisibility: "link" });
