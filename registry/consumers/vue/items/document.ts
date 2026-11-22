import { h } from "vue";
import { Document } from "../components/ui/vue/document.js";

export default () => h(Document, { label: "README.md", content: "# Rate limits\n\nBack off on a 429." });
