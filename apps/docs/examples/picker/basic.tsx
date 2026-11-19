"use client";
import { useState } from "react";
import { Picker } from "@/components/ui/picker";

function FolderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

const initialProjects = [
  { value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui", icon: <FolderIcon /> },
  { value: "docs", label: "docs", description: "~/code/docs", icon: <FolderIcon /> },
  { value: "registry", label: "registry", description: "~/code/registry", icon: <FolderIcon /> },
];

export default function PickerExample() {
  const [projects, setProjects] = useState(initialProjects);
  const [project, setProject] = useState<string | null>("agent-ui");
  return (
    <Picker
      label="Work in"
      placeholder="Search projects…"
      items={projects}
      actions={[{ id: "new-project", label: "New project", icon: <PlusIcon /> }]}
      value={project}
      onValueChange={setProject}
      onAction={() => {
        const value = `untitled-${projects.length - initialProjects.length + 1}`;
        setProjects([
          ...projects,
          { value, label: value, description: `~/code/${value}`, icon: <FolderIcon /> },
        ]);
        setProject(value);
      }}
    />
  );
}
