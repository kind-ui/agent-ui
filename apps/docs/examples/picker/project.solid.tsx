import { createSignal } from "solid-js";
import { Picker } from "@/components/ui/solid/picker";

const projects = [
  {
    value: "kind-ui/agent-ui",
    label: "agent-ui",
    description: "Chat components for agents",
    group: "kind-ui",
  },
  { value: "kind-ui/docs", label: "docs", description: "The documentation site", group: "kind-ui" },
  { value: "acme/api", label: "api", description: "Public REST API", group: "acme" },
  { value: "acme/web", label: "web", description: "Customer dashboard", group: "acme" },
  { value: "acme/legacy", label: "legacy", description: "Archived", group: "acme", disabled: true },
];

export default function PickerProjectExample() {
  const [project, setProject] = createSignal<string | null>("kind-ui/agent-ui");
  return (
    <Picker
      label="Project"
      placeholder="Search projects…"
      items={projects}
      value={project()}
      onValueChange={setProject}
    />
  );
}
