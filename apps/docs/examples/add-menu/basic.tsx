"use client";
import type { ComposerDraft } from "@kind-ui/agent-ui/core";
import { type ReactNode, useRef, useState } from "react";
import { AddMenu } from "@/components/ui/add-menu";
import { Composer, ComposerAttachments, ComposerInput, ComposerSubmit } from "@/components/ui/composer";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const items = [
  {
    id: "upload",
    label: "Upload file",
    description: "Attach files from your computer",
    icon: (
      <Icon>
        <path d="M12 3v12" />
        <path d="m17 8-5-5-5 5" />
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      </Icon>
    ),
  },
  {
    id: "context",
    label: "Add context",
    description: "Mention the open file",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
      </Icon>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    group: "Plugins",
    icon: (
      <Icon>
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <path d="M6 9v12" />
      </Icon>
    ),
    items: [
      { id: "github-issue", label: "Link issue", description: "#128 Retries never stop" },
      { id: "github-pr", label: "Review pull request", description: "#131 Add backoff" },
    ],
  },
  {
    id: "docs",
    label: "Docs",
    group: "Plugins",
    icon: (
      <Icon>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </Icon>
    ),
    items: [{ id: "docs-retries", label: "Retries guide", description: "Mention the page" }],
  },
];

const inserts: Record<string, string> = {
  context: "[@client.ts](mention:src/client.ts)",
  "github-issue": "Fixes #128",
  "github-pr": "Review #131",
  "docs-retries": "[@Retries guide](mention:docs/retries)",
};

export default function AddMenuExample() {
  const [draft, setDraft] = useState<ComposerDraft>({ text: "", tokens: [], attachments: [] });
  const files = useRef<HTMLInputElement>(null);

  return (
    <>
      <Composer
        aria-label="Message"
        value={draft}
        onValueChange={setDraft}
        onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1000))}
      >
        <ComposerAttachments />
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <AddMenu
          style={{ gridArea: "attach" }}
          items={items}
          onAction={(id) => {
            if (id === "upload") files.current?.click();
            else
              setDraft((draft) => ({
                ...draft,
                text: `${draft.text.trimEnd()} ${inserts[id]} `.trimStart(),
              }));
          }}
        />
        <ComposerSubmit />
      </Composer>
      <input
        ref={files}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          const chosen = Array.from(event.target.files ?? [], (file) => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            mediaType: file.type,
          }));
          setDraft((draft) => ({ ...draft, attachments: [...draft.attachments, ...chosen] }));
          event.target.value = "";
        }}
      />
    </>
  );
}
