import { h } from "vue";
import { Diff } from "../components/ui/vue/diff.js";

export default () =>
  h(Diff, { files: [{ path: "src/app.ts", before: "const a = 1;\n", after: "const a = 2;\n" }] });
