"use client";
import type { FileTreeEntry, TestSuite, TranscriptSegment } from "@kind-ui/agent-ui";
import { Fragment, useEffect, useState } from "react";
import { Action } from "@/components/ui/action";
import { Document } from "@/components/ui/document";
import { FileTree } from "@/components/ui/file-tree";
import { GeneratedImage } from "@/components/ui/generated-image";
import { InlineCitation } from "@/components/ui/inline-citation";
import { Message, MessageContent } from "@/components/ui/message";
import { Selection } from "@/components/ui/selection";
import { Sources } from "@/components/ui/sources";
import { Terminal } from "@/components/ui/terminal";
import { TestResults } from "@/components/ui/test-results";
import { Transcript } from "@/components/ui/transcript";
import lighthouse from "../generated-image/lighthouse.png";
import preview from "../generated-image/lighthouse-preview.png";

const ESC = "\x1b";

const timed = (id: string, speaker: string, start: number, text: string): TranscriptSegment => {
  let at = start;
  const words = text.split(" ").map((word) => {
    const timing = { text: word, start: at, end: at + 0.3 };
    at += 0.4;
    return timing;
  });
  return { id, speaker, start, end: at, text, words };
};

const call = [
  timed("1", "Priya", 0, "Checkout fell over again when the payments API started returning 429s."),
  timed("2", "Marco", 5, "Our client retries at once, three times in a row, so it never gets a chance."),
  timed("3", "Priya", 11, "Let's back off properly and respect Retry-After."),
];
const callLength = 15;

const terminal = [
  `${ESC}[1m> checkout@2.4.0 test retry${ESC}[0m`,
  `${ESC}[32m✓${ESC}[0m retry-after.test.ts ${ESC}[90m(2 tests)${ESC}[0m`,
  `${ESC}[31m✗${ESC}[0m retry.test.ts ${ESC}[90m(1 failed)${ESC}[0m`,
  `  ${ESC}[31mExpected${ESC}[0m ${ESC}[33m100${ESC}[0m, received ${ESC}[36m200${ESC}[0m`,
  "",
  `${ESC}[1;31mTests: 1 failed${ESC}[0m, ${ESC}[1;32m3 passed${ESC}[0m, 4 total`,
];

const suites: TestSuite[] = [
  {
    id: "retry-after",
    name: "retry-after.test.ts",
    tests: [
      { id: "seconds", name: "reads a delay in seconds", status: "pass", durationMs: 3 },
      { id: "date", name: "reads an HTTP date", status: "pass", durationMs: 4 },
    ],
  },
  {
    id: "retry",
    name: "retry.test.ts",
    tests: [
      { id: "cap", name: "stops after three attempts", status: "pass", durationMs: 12 },
      {
        id: "delay",
        name: "waits between attempts",
        status: "fail",
        durationMs: 9,
        error: {
          message: "AssertionError: expected 100, got 200",
          stack: `AssertionError: expected 100, got 200
    at Context.<anonymous> (/app/test/retry.test.ts:31:24)
    at callFn (/app/node_modules/mocha/lib/runnable.js:366:21)
    at processImmediate (node:internal/timers:483:21)`,
        },
      },
    ],
  },
];

const changes: FileTreeEntry[] = [
  { path: "src/retry.ts", change: "modified", additions: 14, deletions: 3 },
  { path: "src/retry-after.ts", change: "added", additions: 22 },
  { path: "test/retry-after.test.ts", change: "added", additions: 31 },
  { path: "docs/retry.md", change: "added", additions: 12 },
];

const note = `# Retry backoff

Failed requests now wait before trying again.

| Attempt | Delay |
| --- | --- |
| 1 | 100 ms |
| 2 | 200 ms |
| 3 | 400 ms |

When a response has \`Retry-After\`, that delay wins. After three attempts the error reaches the caller.
`.split("\n");

const sources = [
  {
    id: "429",
    title: "429 Too Many Requests",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429",
    snippet: "The user has sent too many requests in a given amount of time.",
  },
  {
    id: "retry-after",
    title: "Retry-After header",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After",
    snippet: "How long the user agent should wait before making a follow-up request.",
  },
  {
    id: "rfc",
    title: "RFC 9110: HTTP Semantics",
    url: "https://www.rfc-editor.org/rfc/rfc9110",
  },
];

const answer = [
  {
    text: "Retries now wait 100 ms, then 200 ms, then 400 ms, and stop after three attempts.",
    node: (
      <Fragment key="backoff">
        Retries now wait 100 ms, then 200 ms, then 400 ms, and stop after three attempts{" "}
        <InlineCitation sources={[sources[0]]} label="1" />.
      </Fragment>
    ),
  },
  {
    text: " When the server sends Retry-After, the client waits that long instead.",
    node: (
      <Fragment key="header">
        {" "}
        When the server sends <code>Retry-After</code>, the client waits that long instead{" "}
        <InlineCitation sources={[sources[1], sources[2]]} label="2" />.
      </Fragment>
    ),
  },
  {
    text: " One test still fails: it expects the old fixed delay, so it needs the new numbers.",
    node: (
      <Fragment key="failure">
        {" "}
        One test still fails: it expects the old fixed delay, so it needs the new numbers.
      </Fragment>
    ),
  },
];

const explanation =
  "**Exponential backoff** doubles the wait after each failure, so a busy server gets room to recover instead of a burst of retries.".split(
    " ",
  );

const TESTS = 1;
const RESULTS = TESTS + terminal.length;
const NOTE = RESULTS + 3;
const IMAGE = NOTE + note.length;
const ANSWER = IMAGE + 11;
const DONE = ANSWER + answer.length;

function Run() {
  const [tick, setTick] = useState(0);
  const [time, setTime] = useState(0);
  const [quote, setQuote] = useState<string>();
  const [explained, setExplained] = useState(0);

  useEffect(() => {
    if (tick >= DONE) return;
    const timer = setTimeout(() => setTick(tick + 1), 250);
    return () => clearTimeout(timer);
  }, [tick]);

  useEffect(() => {
    if (!quote || explained >= explanation.length) return;
    const timer = setTimeout(() => setExplained(explained + 1), 80);
    return () => clearTimeout(timer);
  }, [quote, explained]);

  const progress = Math.min(Math.max(tick - IMAGE, 0) * 10, 100);
  const shown = answer.slice(0, tick - ANSWER);

  return (
    <div className="flex flex-col gap-4">
      <Message aria-label="User message" messageRole="user" text="Fix the retry bug from this call.">
        <MessageContent>Fix the retry bug from this call.</MessageContent>
      </Message>
      <div className="flex flex-col gap-2">
        <Transcript label="Incident call" segments={call} currentTime={time} onSeek={setTime} />
        <input
          type="range"
          aria-label="Call position"
          min={0}
          max={callLength}
          step={0.1}
          value={time}
          onChange={(event) => setTime(Number(event.target.value))}
        />
      </div>
      <div className="flex flex-col gap-1">
        {tick >= TESTS && (
          <Terminal
            command="npm test -- retry"
            output={terminal.slice(0, tick - TESTS).join("\n")}
            exitCode={tick >= RESULTS ? 1 : undefined}
            durationSeconds={1.6}
            defaultOpen
          />
        )}
        {tick >= RESULTS && <TestResults suites={suites} defaultOpen />}
        {tick >= RESULTS + 1 && <FileTree entries={changes} defaultExpanded={["src", "test", "docs"]} />}
      </div>
      {tick >= NOTE && (
        <Document
          label="docs/retry.md"
          content={note.slice(0, tick - NOTE).join("\n")}
          streaming={tick < IMAGE}
        />
      )}
      {tick >= IMAGE && (
        <GeneratedImage
          alt="A lighthouse at dusk, the design note's cover"
          status={progress < 100 ? "generating" : "ready"}
          progress={progress}
          preview={progress >= 30 ? preview.src : undefined}
          src={lighthouse.src}
          width={lighthouse.width}
          height={lighthouse.height}
          className="max-w-sm"
        />
      )}
      {tick >= ANSWER && (
        <Message
          aria-label="Assistant message"
          messageRole="assistant"
          status={tick >= DONE ? "complete" : "streaming"}
          text={shown.map((sentence) => sentence.text).join("")}
        >
          <MessageContent>
            <Selection
              label="Reply"
              actions={[{ id: "explain", label: "Explain" }]}
              onAction={({ text }) => {
                setQuote(text);
                setExplained(0);
              }}
            >
              <p>{shown.map((sentence) => sentence.node)}</p>
            </Selection>
          </MessageContent>
        </Message>
      )}
      {tick >= DONE && <Sources sources={sources} />}
      {quote && (
        <Action
          label="Explain"
          status={explained < explanation.length ? "running" : "complete"}
          quote={quote}
          result={explanation.slice(0, explained).join(" ")}
        />
      )}
    </div>
  );
}

export default function DeveloperOutputShowcase() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setRun(run + 1)}
        className="self-end rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm hover:bg-[var(--kind-color-hover)]"
      >
        Replay
      </button>
      <Run key={run} />
    </div>
  );
}
