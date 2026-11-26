import { h } from "vue";
import { Diff } from "../components/ui/vue/diff.js";

export default () =>
  h(Diff, {
    file: { path: "src/greet.ts" },
    before: 'export const greeting = "Hello";\n',
    after: 'export const greeting = "Hello, world";\n',
  });
