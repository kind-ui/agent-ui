import { createMarkdownEngine, type MarkdownEngine, type Token } from "@kind-ui/agent-ui/core";
import longAnswer from "../../core/fixtures/long-answer.md?raw";

export { longAnswer };

export const answer = `## Retry with backoff

Wrap the request in a loop that waits a little longer after each failure, and give up after a few tries. Keep the delay **bounded** so a long outage doesn't stall the queue.

\`\`\`ts
async function retry<T>(run: () => Promise<T>, tries = 4): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt + 1 >= tries) throw error;
      await sleep(2 ** attempt * 250);
    }
  }
}
\`\`\`

| Attempt | Delay | Total wait | Notes |
| ------: | ----: | ---------: | :---------------------------------------- |
| 1 | 250 ms | 250 ms | Most transient errors clear here. |
| 2 | 500 ms | 750 ms | |
| 3 | 1 s | 1.75 s | Log a warning with the request id. |
| 4 | 2 s | 3.75 s | Give up and surface the error to the user. |

- Retry only idempotent requests.
- Add jitter, so clients that failed together don't retry together.

> Read the \`Retry-After\` header first when the server sends one.
`;

export const unsafe = "A [bad link](javascript:alert(1)) and <img src=x onerror=alert(1)> stay text.";

export const wideTable = `| Region | Requests | Errors | p50 | p95 | p99 | Saturation | Owner | Escalation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| us-east-1 | 18,204,113 | 1,204 | 41 ms | 120 ms | 380 ms | 62% | Platform | #platform-oncall |
| eu-west-1 | 9,412,870 | 377 | 38 ms | 101 ms | 290 ms | 48% | Platform | #platform-oncall |
`;

/** Each `set`: the parses it took, how many blocks it returned that weren't final before it, and how many are final now. */
export type EngineRecord = { parses: number; open: number; final: number };

export function recordedEngine(): { engine: MarkdownEngine; records: EngineRecord[] } {
  const engine = createMarkdownEngine();
  const records: EngineRecord[] = [];
  let finalBefore = 0;
  return {
    records,
    engine: {
      set(source, streaming) {
        const parsesBefore = engine.stats().parses;
        const blocks = engine.set(source, streaming);
        const final = blocks.filter((block) => block.final).length;
        records.push({
          parses: engine.stats().parses - parsesBefore,
          open: blocks.length - finalBefore,
          final,
        });
        finalBefore = final;
        return blocks;
      },
      stats: () => engine.stats(),
    },
  };
}

export type HighlightRequest = { code: string; resolve: (tokens: Token[]) => void };

/** A highlighter whose results the test resolves, in any order. */
export function deferredHighlight() {
  const requests: HighlightRequest[] = [];
  const highlight = (code: string) =>
    new Promise<Token[]>((resolve) => {
      requests.push({ code, resolve });
    });
  return { highlight, requests };
}
