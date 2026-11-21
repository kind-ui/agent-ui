import { ModelControl } from "../components/ui/solid/model-control.js";

export default function ModelControlItem() {
  return (
    <ModelControl
      defaultModel="gpt-5"
      defaultEffort="high"
      models={[{ id: "gpt-5", name: "GPT-5", efforts: ["low", "medium", "high"] }]}
    />
  );
}
