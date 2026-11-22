import { h } from "vue";
import { StackTrace } from "../components/ui/vue/stack-trace.js";

export default () =>
  h(StackTrace, {
    stack: "TypeError: x is undefined\n    at main (/app/src/index.ts:7:1)",
    onOpenFrame: () => {},
  });
