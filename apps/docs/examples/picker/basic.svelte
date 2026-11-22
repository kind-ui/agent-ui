<script lang="ts">
  import { Picker, type PickerChoice } from "@/components/ui/svelte/picker/index.js";

  const initialProjects: PickerChoice[] = [
    { value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui", icon: folderIcon },
    { value: "docs", label: "docs", description: "~/code/docs", icon: folderIcon },
    { value: "registry", label: "registry", description: "~/code/registry", icon: folderIcon },
  ];

  let projects = $state.raw(initialProjects);
  let project = $state<string | null>("agent-ui");

  function addProject() {
    const value = `untitled-${projects.length - initialProjects.length + 1}`;
    projects = [...projects, { value, label: value, description: `~/code/${value}`, icon: folderIcon }];
    project = value;
  }
</script>

{#snippet folderIcon()}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
    />
  </svg>
{/snippet}

{#snippet plusIcon()}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
{/snippet}

<Picker
  label="Work in"
  placeholder="Search projects…"
  items={projects}
  actions={[{ id: "new-project", label: "New project", icon: plusIcon }]}
  bind:value={project}
  onAction={addProject}
/>
