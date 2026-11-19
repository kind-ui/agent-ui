"use client";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ModelSelector } from "@/components/ui/model-selector";
import { ReasoningEffort } from "@/components/ui/reasoning-effort";
import { AnthropicLogo, GoogleMonogram, MicrosoftLogo, OpenAILogo, XAILogo } from "./logos";

const models = [
  {
    id: "claude-opus-5.5",
    name: "Claude Opus 5.5",
    group: "Anthropic",
    description: "Not on your plan",
    disabled: true,
    icon: <AnthropicLogo />,
  },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    group: "OpenAI",
    description: "Deep reasoning",
    icon: <OpenAILogo />,
  },
  {
    id: "gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    group: "OpenAI",
    description: "Fast and affordable",
    icon: <OpenAILogo />,
  },
  {
    id: "mai-code-2",
    name: "MAI Code 2",
    group: "Microsoft",
    description: "Built for code",
    icon: <MicrosoftLogo />,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    group: "Google",
    description: "Long context",
    icon: <GoogleMonogram />,
  },
];

const moreModels = [
  { id: "gpt-6-astra", name: "GPT-6 Astra", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", group: "Google", icon: <GoogleMonogram /> },
  { id: "grok-4.7", name: "Grok 4.7", group: "xAI", icon: <XAILogo /> },
];

const allModels = [...models, ...moreModels];
const actions = [{ id: "more", label: "More models" }];

export default function ModelSelectorExample() {
  const [model, setModel] = useState<string | null>("claude-sonnet-5.5");
  const [effort, setEffort] = useState<string | null>("medium");
  const [showAll, setShowAll] = useState(false);
  return (
    <Composer aria-label="Message" className="w-full max-w-xl" onSubmit={() => undefined}>
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <div className="flex min-w-0 flex-wrap items-center gap-2" style={{ gridArea: "attach" }}>
        <ModelSelector
          models={showAll ? allModels : models}
          value={model}
          onValueChange={setModel}
          actions={showAll ? undefined : actions}
          onAction={showAll ? undefined : () => setShowAll(true)}
        />
        <ReasoningEffort value={effort} onValueChange={setEffort} />
      </div>
      <ComposerSubmit />
    </Composer>
  );
}
