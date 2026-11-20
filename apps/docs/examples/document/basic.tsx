"use client";

import { Document } from "@/components/ui/document";

const readme = `# Rate limits

The REST API allows 5,000 requests an hour for each authenticated user.

## Headers

| Header | Meaning |
| --- | --- |
| \`x-ratelimit-remaining\` | Requests left in this window |
| \`x-ratelimit-reset\` | When the window resets |

## Backing off

1. Read \`x-ratelimit-remaining\` on every response.
2. When it reaches zero, wait until \`x-ratelimit-reset\`.
3. Retry with exponential backoff on a 429.

## Conditional requests

Send \`If-None-Match\` with the last \`ETag\`. A 304 doesn't count against the limit.
`;

const downloads = [
  { id: "md", label: "Markdown" },
  { id: "txt", label: "Plain text" },
];

function save(formatId: string | undefined) {
  const name = formatId === "txt" ? "README.txt" : "README.md";
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([readme], { type: "text/plain" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function DocumentExample() {
  return (
    <Document
      label="README.md"
      content={readme}
      downloads={downloads}
      onDownload={save}
      className="w-full max-w-lg"
    />
  );
}
