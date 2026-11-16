export type StreamingTextDiff = { kind: "append"; appended: string } | { kind: "reset" };

/** `next` either extends `prev`, and only the rest is new, or replaces it: shrunk, regenerated or edited. */
export function streamingTextDiff(prev: string, next: string): StreamingTextDiff {
  return next.startsWith(prev) ? { kind: "append", appended: next.slice(prev.length) } : { kind: "reset" };
}
