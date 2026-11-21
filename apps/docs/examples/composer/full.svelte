<script lang="ts">
  import type { ComponentProps } from "svelte";
  import type { EffortLevel, SettingsValues } from "@kind-ui/agent-ui";
  import type { DictationEvent, DictationSource } from "@kind-ui/agent-ui/core";
  import { AddMenu } from "@/components/ui/svelte/add-menu/index.js";
  import { ApprovalMode } from "@/components/ui/svelte/approval-mode/index.js";
  import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import { ContextBar } from "@/components/ui/svelte/context-bar/index.js";
  import { Dictation } from "@/components/ui/svelte/dictation/index.js";
  import { ModelControl, type ModelControlModel } from "@/components/ui/svelte/model-control/index.js";
  import type { SettingsMenuSetting } from "@/components/ui/svelte/settings-menu/index.js";
  import { AnthropicLogo, OpenAILogo } from "../model-selector/logos.svelte";

  let {
    onSubmit = () => new Promise<void>((resolve) => setTimeout(resolve, 1000)),
    disabled,
    placeholder = "Ask anything…",
  }: {
    onSubmit?: ComponentProps<typeof Composer>["onSubmit"];
    disabled?: boolean;
    placeholder?: string;
  } = $props();

  const addItems = [
    { id: "client", label: "Open file", description: "src/lib/client.ts" },
    { id: "tests", label: "Test folder", description: "src/__tests__" },
  ];

  const additions: Record<string, { id: string; label: string; kind: string } | undefined> = {
    client: { id: "client", label: "src/lib/client.ts", kind: "file" },
    tests: { id: "tests", label: "src/__tests__", kind: "folder" },
  };

  const models: ModelControlModel[] = [
    { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: AnthropicLogo },
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: OpenAILogo },
  ];

  const levels: EffortLevel[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const modes = [
    { value: "ask", label: "Ask every time", description: "Approve each tool call" },
    { value: "edits", label: "Allow edits", description: "Edit files without asking" },
    { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
  ];

  const settings: SettingsMenuSetting[] = [
    { type: "toggle", id: "search", label: "Web search" },
    { type: "toggle", id: "memory", label: "Memory" },
  ];

  const words = "Add a retry with backoff to the fetch client".split(" ");
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Plays back a recording instead of opening the microphone, so the example runs without a speech service.
  const demoSource: DictationSource = {
    async *start(signal): AsyncGenerator<DictationEvent> {
      let heard = 0;
      for (let tick = 0; !signal.aborted; tick++) {
        const speaking = heard < words.length;
        yield { level: speaking ? 0.25 + 0.6 * Math.abs(Math.sin(tick * 1.7)) : 0.05 };
        if (speaking && tick % 5 === 4) {
          heard++;
          yield { text: words.slice(0, heard).join(" "), final: false };
        }
        await wait(80);
      }
      if (heard === 0 || signal.reason === "cancel") return;
      await wait(600);
      yield { text: words.slice(0, heard).join(" "), final: true };
    },
  };

  const editor = $props.id();
  let chips = $state.raw([
    { id: "layout", label: "src/app/layout.tsx", kind: "file" },
    { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection" },
    { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url" },
  ]);
  let model = $state<string | null>("claude-sonnet-5.5");
  let effort = $state("medium");
  let mode = $state("ask");
  let values: SettingsValues = $state.raw({ search: true, memory: false });
</script>

<Composer aria-label="Message" {onSubmit} {disabled}>
  <ContextBar
    {chips}
    onRemove={(id: string) => (chips = chips.filter((chip) => chip.id !== id))}
    focusFallback={() => document.getElementById(editor)}
  />
  <ComposerInput id={editor} aria-label="Prompt" {placeholder} />
  <div class="flex min-w-0 flex-wrap items-center gap-1.5" style="grid-area: attach">
    <AddMenu
      items={addItems}
      onAction={(id: string) => {
        const chip = additions[id];
        if (chip && !chips.some((current) => current.id === id)) chips = [...chips, chip];
      }}
    />
    <ModelControl {models} bind:model {levels} bind:effort {settings} bind:values />
    <ApprovalMode {modes} bind:value={mode} />
  </div>
  <Dictation source={demoSource} />
  <ComposerSubmit />
</Composer>
