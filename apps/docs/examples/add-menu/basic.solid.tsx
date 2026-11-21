import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";
import { AddMenu } from "@/components/ui/solid/add-menu";

function Icon(props: { children: JSX.Element }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {props.children}
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
  upload: "Chose files to upload",
  context: "[@client.ts](mention:src/client.ts)",
  "github-issue": "Fixes #128",
  "github-pr": "Review #131",
  "docs-retries": "[@Retries guide](mention:docs/retries)",
};

export default function AddMenuExample() {
  const [text, setText] = createSignal("");

  return (
    <div class="flex items-center gap-2">
      <AddMenu items={items} onAction={(id) => setText(inserts[id] ?? "")} />
      <output class="text-sm">{text()}</output>
    </div>
  );
}
