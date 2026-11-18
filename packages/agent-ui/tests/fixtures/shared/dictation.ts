import type { DictationEvent, DictationSource } from "@kind-ui/agent-ui/core";

type Text = { text: string; reason: string; source?: string };

export function dictationHost() {
  const texts: Text[] = [];
  let queue: DictationEvent[] = [];
  let ended = false;
  let wake = () => {};
  let starts = 0;
  let signal: AbortSignal | undefined;
  const source: DictationSource = {
    async *start(next) {
      starts++;
      signal = next;
      queue = [];
      ended = false;
      for (;;) {
        const event = queue.shift();
        if (event) yield event;
        else if (ended) return;
        else await new Promise<void>((resolve) => (wake = resolve));
      }
    },
  };
  const host = {
    texts,
    get starts() {
      return starts;
    },
    get aborted() {
      return signal?.aborted ?? false;
    },
    push: (event: DictationEvent) => {
      queue.push(event);
      wake();
    },
    end: () => {
      ended = true;
      wake();
    },
  };
  return {
    host,
    source,
    record: (text: string, details: { reason: string; source?: string }) =>
      texts.push({ text, reason: details.reason, source: details.source }),
  };
}
