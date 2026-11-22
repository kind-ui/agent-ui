import { TestResults } from "../components/ui/solid/test-results.js";

export default function TestResultsItem() {
  return (
    <TestResults
      defaultOpen
      suites={[
        {
          id: "math",
          name: "math",
          tests: [
            { id: "sum", name: "adds", status: "pass", durationMs: 2 },
            { id: "div", name: "divides", status: "fail", error: { message: "Error: divided by zero" } },
          ],
        },
      ]}
    />
  );
}
