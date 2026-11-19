"use client";
import type { EffortLevel, ModelOption, SettingsEntry, SettingsValues } from "@kind-ui/agent-ui";
import { type ReactElement, useState } from "react";
import { ModelControl } from "@/components/ui/model-control";
import { AnthropicLogo, MicrosoftLogo, OpenAILogo } from "../model-selector/logos";

const models: ModelOption<ReactElement>[] = [
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: <OpenAILogo /> },
  {
    id: "gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    group: "OpenAI",
    icon: <OpenAILogo />,
    efforts: ["low", "medium"],
  },
  {
    id: "mai-code-2-flash",
    name: "MAI Code 2 Flash",
    group: "Microsoft",
    icon: <MicrosoftLogo />,
    efforts: [],
  },
];

const moreModels: ModelOption<ReactElement>[] = [
  { id: "mai-code-2", name: "MAI Code 2", group: "Microsoft", icon: <MicrosoftLogo /> },
];

const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra High" },
  { value: "max", label: "Max" },
];

const settings: SettingsEntry<ReactElement>[] = [
  { type: "toggle", id: "fast", label: "Fast mode" },
  {
    type: "choice",
    id: "context",
    label: "Context window",
    options: [
      { value: "200k", label: "200K" },
      { value: "1m", label: "1M" },
    ],
  },
];

const actions = [{ id: "more", label: "More models" }];

export default function ModelControlExample() {
  const [model, setModel] = useState<string | null>("claude-opus-5.5");
  const [effort, setEffort] = useState("medium");
  const [values, setValues] = useState<SettingsValues>({ fast: false, context: "1m" });
  const [showAll, setShowAll] = useState(false);

  return (
    <ModelControl
      models={showAll ? [...models, ...moreModels] : models}
      model={model}
      onModelChange={setModel}
      levels={levels}
      effort={effort}
      onEffortChange={setEffort}
      settings={settings}
      values={values}
      onValuesChange={setValues}
      actions={showAll ? undefined : actions}
      onAction={showAll ? undefined : () => setShowAll(true)}
    />
  );
}
