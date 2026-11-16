import type { Source } from "@kind-ui/agent-ui";

export const sources: Source[] = [
  {
    id: "limits",
    title: "Rate limits for the REST API",
    url: "https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api",
    snippet: "Primary rate limits cap how many requests you can make in an hour.",
  },
  {
    id: "retry",
    title: "Exponential backoff and jitter",
    url: "https://www.example.com/blog/backoff",
    favicon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%2316a34a'/%3E%3C/svg%3E",
  },
  { id: "unsafe", title: "Pasted notes", url: "javascript:alert(1)" },
];

export const lateSource: Source = {
  id: "headers",
  title: "Rate limit headers",
  url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After",
  snippet: "Retry-After says how long to wait before the next request.",
};

/** The host's sources: `add` appends one, `rename` replaces the first with a new title. */
export const nextSources = {
  add: (current: Source[]) => [...current, lateSource],
  rename: ([first, ...rest]: Source[]) => [{ ...first, title: "REST API rate limits" } as Source, ...rest],
};
