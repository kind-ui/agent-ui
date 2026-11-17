import type { TestSuite } from "@kind-ui/agent-ui";

const authStack = [
  "AssertionError: expected 401, got 200",
  "    at Context.<anonymous> (/app/test/auth.test.ts:24:31)",
  "    at callFn (/app/node_modules/mocha/lib/runnable.js:366:21)",
  "    at processImmediate (node:internal/timers:483:21)",
].join("\n");

export const suites: TestSuite[] = [
  {
    id: "auth",
    name: "auth",
    tests: [
      { id: "login", name: "logs in with a password", status: "pass", durationMs: 42 },
      {
        id: "bad",
        name: "rejects a wrong password",
        status: "fail",
        durationMs: 18,
        error: { message: "AssertionError: expected 401, got 200", stack: authStack },
      },
      { id: "sso", name: "signs in with SSO", status: "skip" },
    ],
  },
  {
    id: "cart",
    name: "cart",
    tests: [
      { id: "add", name: "adds an item", status: "pass", durationMs: 7 },
      { id: "total", name: "totals the items", status: "pass", durationMs: 3 },
    ],
  },
];

/** The passing suites one test at a time, as a live run reports them. */
export const passingSteps: TestSuite[][] = [
  [{ id: "math", name: "math", tests: [{ id: "sum", name: "adds", status: "pass", durationMs: 2 }] }],
  [
    {
      id: "math",
      name: "math",
      tests: [
        { id: "sum", name: "adds", status: "pass", durationMs: 2 },
        { id: "product", name: "multiplies", status: "pass", durationMs: 1 },
      ],
    },
  ],
];
