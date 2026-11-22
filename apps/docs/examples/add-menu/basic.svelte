<script lang="ts">
  import type { ComposerDraft } from "@kind-ui/agent-ui/core";
  import { AddMenu, type AddMenuEntry } from "@/components/ui/svelte/add-menu/index.js";
  import {
    Composer,
    ComposerAttachments,
    ComposerInput,
    ComposerSubmit,
  } from "@/components/ui/svelte/composer/index.js";

  const items: AddMenuEntry[] = [
    { id: "upload", label: "Upload file", description: "Attach files from your computer", icon: upload },
    { id: "context", label: "Add context", description: "Mention the open file", icon: context },
    {
      id: "github",
      label: "GitHub",
      group: "Plugins",
      icon: github,
      items: [
        { id: "github-issue", label: "Link issue", description: "#128 Retries never stop" },
        { id: "github-pr", label: "Review pull request", description: "#131 Add backoff" },
      ],
    },
    {
      id: "docs",
      label: "Docs",
      group: "Plugins",
      icon: docs,
      items: [{ id: "docs-retries", label: "Retries guide", description: "Mention the page" }],
    },
  ];

  const inserts: Record<string, string> = {
    context: "[@client.ts](mention:src/client.ts)",
    "github-issue": "Fixes #128",
    "github-pr": "Review #131",
    "docs-retries": "[@Retries guide](mention:docs/retries)",
  };

  let draft: ComposerDraft = $state.raw({ text: "", tokens: [], attachments: [] });
  let files: HTMLInputElement;
</script>

{#snippet upload()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m17 8-5-5-5 5" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </svg>
{/snippet}

{#snippet context()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </svg>
{/snippet}

{#snippet github()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M13 6h3a2 2 0 0 1 2 2v7" />
    <path d="M6 9v12" />
  </svg>
{/snippet}

{#snippet docs()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 7v14" />
    <path
      d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
    />
  </svg>
{/snippet}

<Composer
  aria-label="Message"
  bind:value={draft}
  onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1000))}
>
  <ComposerAttachments />
  <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
  <AddMenu
    style="grid-area: attach"
    {items}
    onAction={(id: string) => {
      if (id === "upload") files.click();
      else draft = { ...draft, text: `${draft.text.trimEnd()} ${inserts[id]} `.trimStart() };
    }}
  />
  <ComposerSubmit />
</Composer>
<input
  bind:this={files}
  type="file"
  multiple
  hidden
  onchange={(event) => {
    const chosen = Array.from(event.currentTarget.files ?? [], (file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      mediaType: file.type,
    }));
    draft = { ...draft, attachments: [...draft.attachments, ...chosen] };
    event.currentTarget.value = "";
  }}
/>
