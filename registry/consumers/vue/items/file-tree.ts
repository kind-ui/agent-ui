import { h } from "vue";
import { FileTree } from "../components/ui/vue/file-tree.js";

export default () => h(FileTree, { entries: [{ path: "src/index.ts", change: "modified", additions: 2 }] });
