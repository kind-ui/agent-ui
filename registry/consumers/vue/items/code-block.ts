import { h } from "vue";
import { CodeBlock } from "../components/ui/vue/code-block.js";

export default () => h(CodeBlock, { "aria-label": "Code", code: "const a = 1;", language: "ts" });
