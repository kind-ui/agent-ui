<script module lang="ts">
  export const variants = ["shell", "full", "mod-enter", "attachments"];
</script>

<script lang="ts">
  import type { AttachmentItem, ComposerDraft, ComposerOptions, MotionMode } from "@kind-ui/agent-ui/core";
  import { Attachments } from "../../../../src/svelte/attachments/index.js";
  import {
    Composer,
    ComposerAttach,
    ComposerAttachments,
    ComposerInput,
    ComposerRestored,
    ComposerStop,
    ComposerSubmit,
    ComposerTriggerMenu,
  } from "../../../../src/svelte/composer/index.js";
  import {
    attachmentItems,
    attachmentsHost,
    commands,
    draftOptions,
    history,
    mentions,
    recorder,
  } from "../../shared/composer.js";
  import { expose } from "../../shared/expose.js";

  let { variant, params }: { variant: string; params: URLSearchParams } = $props();

  const unsettled = new Promise<void>(() => {});
  const isFull = $derived(variant === "full" || variant === "mod-enter");
  const motion = $derived(params.has("motion") ? (params.get("motion") as MotionMode) : undefined);
  let mounted = $state(true);
  let draft: ComposerDraft = $state.raw({ text: "", tokens: [], attachments: [] });
  let draftKey = $derived(params.get("draftKey") ?? "chat-1");
  const { onSubmit, onStop } = $derived(isFull ? recorder() : { onSubmit: undefined, onStop: undefined });
  const drafts = $derived(isFull ? draftOptions(params) : {});
  const options: Partial<ComposerOptions> = $derived({
    ...drafts,
    ...(params.has("draft") ? { draftKey } : {}),
    ...(params.has("controlled") ? { value: draft } : {}),
    ...(params.has("stop") ? { onStop } : {}),
    ...(motion ? { motion } : {}),
  });

  const onValueChange: ComposerOptions["onValueChange"] = (value, details) => {
    if ((window as { refuseEdits?: boolean }).refuseEdits) details.cancel();
    else draft = value;
  };
  let items: AttachmentItem[] = $state.raw(attachmentItems());

  $effect(() => {
    if (isFull) {
      expose({
        unmountComposer: () => (mounted = false),
        remountComposer: () => (mounted = true),
        setDraftKey: (next: string) => (draftKey = next),
      });
    }
    if (variant === "attachments") attachmentsHost((change) => (items = change(items)));
  });
</script>

{#if variant === "shell"}
  <Composer
    aria-label="Message"
    class="border-[rgb(1,2,3)] data-[pending]:opacity-50"
    onSubmit={() => unsettled}
  >
    <ComposerInput aria-label="Prompt" />
    <ComposerSubmit>Send</ComposerSubmit>
  </Composer>
{:else if isFull && mounted}
  <div class="mx-auto max-w-xl p-6">
    <Composer
      aria-label="Message"
      {mentions}
      {commands}
      {history}
      accept="image/*,.txt,.md"
      maxSize={3072}
      submitOn={variant === "mod-enter" ? "mod-enter" : "enter"}
      {onSubmit}
      {...options}
      {onValueChange}
    >
      <ComposerAttachments />
      <ComposerInput
        aria-label="Prompt"
        placeholder="Ask anything. Type @ to mention, / for commands"
        onkeydowncapture={(event: KeyboardEvent) => {
          if (event.key === "Enter" && (window as { blockEnter?: boolean }).blockEnter) event.preventDefault();
        }}
      >
        <ComposerTriggerMenu />
      </ComposerInput>
      <ComposerAttach />
      <ComposerRestored />
      <ComposerSubmit />
      <ComposerStop />
    </Composer>
  </div>
{:else if variant === "attachments"}
  <div class="p-6">
    <Attachments
      aria-label="Files"
      {items}
      onRemove={(id: string) => (items = items.filter((item) => item.id !== id))}
      {...motion ? { motion } : {}}
    />
  </div>
{/if}
