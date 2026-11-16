"use client";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ModelSelector } from "@/components/ui/model-selector";
import { ReasoningEffort } from "@/components/ui/reasoning-effort";

const models = [
  { id: "gpt-5", name: "GPT-5", group: "OpenAI", description: "Deep reasoning" },
  { id: "gpt-5-mini", name: "GPT-5 mini", group: "OpenAI", description: "Fast and affordable" },
  { id: "sonnet-4", name: "Sonnet 4", group: "Anthropic", description: "Balanced for everyday work" },
  { id: "opus-4", name: "Opus 4", group: "Anthropic", description: "Not on your plan", disabled: true },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", group: "Google", description: "Long context" },
];

export default function ModelSelectorExample() {
  const [model, setModel] = useState<string | null>("sonnet-4");
  const [effort, setEffort] = useState<string | null>("medium");
  return (
    <Composer aria-label="Message" className="w-full max-w-xl" onSubmit={() => undefined}>
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <div className="flex items-center gap-2" style={{ gridArea: "attach" }}>
        <ModelSelector models={models} value={model} onValueChange={setModel} />
        <ReasoningEffort value={effort} onValueChange={setEffort} />
      </div>
      <ComposerSubmit />
    </Composer>
  );
}
