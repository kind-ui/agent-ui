import type { EffortLevel, ModelOption, SettingsEntry, SettingsValues } from "@kind-ui/agent-ui";
import type { DictationEvent, DictationSource } from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createSignal, merge } from "solid-js";
import { AddMenu } from "@/components/ui/solid/add-menu";
import { ApprovalMode } from "@/components/ui/solid/approval-mode";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/solid/composer";
import { ContextBar } from "@/components/ui/solid/context-bar";
import { Dictation } from "@/components/ui/solid/dictation";
import { ModelControl } from "@/components/ui/solid/model-control";
import { AnthropicLogo, OpenAILogo } from "../model-selector/logos.solid";

const addItems = [
  { id: "client", label: "Open file", description: "src/lib/client.ts" },
  { id: "tests", label: "Test folder", description: "src/__tests__" },
];

const additions: Record<string, { id: string; label: string; kind: string }> = {
  client: { id: "client", label: "src/lib/client.ts", kind: "file" },
  tests: { id: "tests", label: "src/__tests__", kind: "folder" },
};

const models: ModelOption<() => JSX.Element>[] = [
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

const settings: SettingsEntry<() => JSX.Element>[] = [
  { type: "toggle", id: "search", label: "Web search" },
  { type: "toggle", id: "memory", label: "Memory" },
];

const context = [
  { id: "layout", label: "src/app/layout.tsx", kind: "file" },
  { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection" },
  { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url" },
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

type FullComposerProps = Pick<ComponentProps<typeof Composer>, "onSubmit" | "disabled"> & {
  placeholder?: string;
};

const send = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));

export default function FullComposerExample(props: FullComposerProps) {
  const merged = merge({ onSubmit: send, placeholder: "Ask anything…" }, props);
  const [chips, setChips] = createSignal(context);
  const [model, setModel] = createSignal<string | null>("claude-sonnet-5.5");
  const [effort, setEffort] = createSignal("medium");
  const [mode, setMode] = createSignal("ask");
  const [values, setValues] = createSignal<SettingsValues>({ search: true, memory: false });
  let editor: HTMLDivElement | undefined;

  return (
    <Composer aria-label="Message" onSubmit={merged.onSubmit} disabled={merged.disabled}>
      <ContextBar
        chips={chips()}
        onRemove={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        focusFallback={() => editor ?? null}
      />
      <ComposerInput
        ref={(el) => {
          editor = el;
        }}
        aria-label="Prompt"
        placeholder={merged.placeholder}
      />
      <div class="flex min-w-0 flex-wrap items-center gap-1.5" style={{ "grid-area": "attach" }}>
        <AddMenu
          items={addItems}
          onAction={(id) => {
            const added = additions[id];
            if (added)
              setChips((current) => (current.some((chip) => chip.id === id) ? current : [...current, added]));
          }}
        />
        <ModelControl
          models={models}
          model={model()}
          onModelChange={(value) => setModel(value)}
          levels={levels}
          effort={effort()}
          onEffortChange={(value) => setEffort(value)}
          settings={settings}
          values={values()}
          onValuesChange={(next) => setValues(next)}
        />
        <ApprovalMode modes={modes} value={mode()} onValueChange={(value) => setMode(value)} />
      </div>
      <Dictation source={demoSource} />
      <ComposerSubmit />
    </Composer>
  );
}
