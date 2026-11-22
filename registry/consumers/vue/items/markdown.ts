import { h } from "vue";
import { Markdown } from "../components/ui/vue/markdown.js";

export default () => h(Markdown, { source: "# Title\n\nSome **bold** text.\n\n```ts\nconst a = 1;\n```\n" });
