import { createSignal } from "solid-js";
import { Picker, type PickerChoice } from "@/components/ui/solid/picker";

// Image URLs rather than elements: a Solid element is one DOM node, and the chosen item's icon shows in the trigger and its row at once.
const svg = (paths: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
  )}`;
const folderIcon = svg(
  '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
);
const plusIcon = svg('<path d="M5 12h14"/><path d="M12 5v14"/>');

const initialProjects: PickerChoice[] = [
  { value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui", icon: folderIcon },
  { value: "docs", label: "docs", description: "~/code/docs", icon: folderIcon },
  { value: "registry", label: "registry", description: "~/code/registry", icon: folderIcon },
];

export default function PickerExample() {
  const [projects, setProjects] = createSignal(initialProjects);
  const [project, setProject] = createSignal<string | null>("agent-ui");
  return (
    <Picker
      label="Work in"
      placeholder="Search projects…"
      items={projects()}
      actions={[{ id: "new-project", label: "New project", icon: plusIcon }]}
      value={project()}
      onValueChange={setProject}
      onAction={() => {
        const value = `untitled-${projects().length - initialProjects.length + 1}`;
        setProjects([
          ...projects(),
          { value, label: value, description: `~/code/${value}`, icon: folderIcon },
        ]);
        setProject(value);
      }}
    />
  );
}
