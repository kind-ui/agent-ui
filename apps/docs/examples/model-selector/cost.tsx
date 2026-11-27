import { ModelSelector } from "@/components/ui/model-selector";

const models = [
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", cost: "1×" },
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", cost: "3×" },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", cost: "2×" },
  { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", group: "OpenAI", cost: "0.33×" },
  { id: "mai-code-2-flash", name: "MAI Code 2 Flash", group: "Microsoft", cost: "Free" },
];

export default function ModelSelectorCostExample() {
  return <ModelSelector models={models} defaultValue="claude-sonnet-5.5" />;
}
