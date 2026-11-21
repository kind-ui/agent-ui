import { ModelSelector } from "../components/ui/solid/model-selector.js";

export default function ModelSelectorItem() {
  return (
    <ModelSelector
      defaultValue="gpt-5"
      models={[
        { id: "gpt-5", name: "GPT-5", group: "OpenAI" },
        { id: "claude", name: "Claude", group: "Anthropic" },
      ]}
    />
  );
}
