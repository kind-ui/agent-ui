import type { DocumentDownload } from "@kind-ui/agent-ui/core";

export const readme = `# Rate limits

The REST API allows 5,000 requests an hour for each authenticated user.

## Headers

Every response reports what's left:

| Header | Meaning |
| --- | --- |
| \`x-ratelimit-limit\` | Requests allowed an hour |
| \`x-ratelimit-remaining\` | Requests left in this window |
| \`x-ratelimit-reset\` | When the window resets |

## Backing off

1. Read \`x-ratelimit-remaining\` on every response.
2. When it reaches zero, wait until \`x-ratelimit-reset\`.
3. Retry with exponential backoff on a 429.

## Secondary limits

Concurrent requests and heavy endpoints have limits of their own. Space out writes, and don't poll.

## Conditional requests

Send \`If-None-Match\` with the last \`ETag\`. A 304 doesn't count against the limit.
`;

export const code = `export async function withBackoff<T>(run: () => Promise<T>, tries = 3): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt + 1 >= tries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 250));
    }
  }
}
`;

export const notes = "Rate limits reset hourly.\nSecondary limits apply to bursts of writes.";

export const downloads: DocumentDownload[] = [
  { id: "md", label: "Markdown" },
  { id: "txt", label: "Text" },
];

/** The README in chunks, as a model streams it. */
export const chunks = readme.match(/[\s\S]{1,48}/g) ?? [];
