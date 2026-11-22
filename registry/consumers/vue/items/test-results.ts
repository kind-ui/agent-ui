import { h } from "vue";
import { TestResults } from "../components/ui/vue/test-results.js";

export default () =>
  h(TestResults, {
    defaultOpen: true,
    suites: [
      {
        id: "math",
        name: "math",
        tests: [
          { id: "sum", name: "adds", status: "pass", durationMs: 2 },
          { id: "div", name: "divides", status: "fail", error: { message: "Error: divided by zero" } },
        ],
      },
    ],
  });
