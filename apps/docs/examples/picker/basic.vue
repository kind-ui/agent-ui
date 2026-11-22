<script setup lang="ts">
import { h, ref, shallowRef } from "vue";
import { Picker } from "@/components/ui/vue/picker";

const svg = (...children: ReturnType<typeof h>[]) =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    children,
  );
const folderIcon = () =>
  svg(
    h("path", {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
    }),
  );
const plusIcon = () => svg(h("path", { d: "M5 12h14" }), h("path", { d: "M12 5v14" }));

const initialProjects = [
  { value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui", icon: folderIcon() },
  { value: "docs", label: "docs", description: "~/code/docs", icon: folderIcon() },
  { value: "registry", label: "registry", description: "~/code/registry", icon: folderIcon() },
];

const projects = shallowRef(initialProjects);
const project = ref<string | null>("agent-ui");
const actions = [{ id: "new-project", label: "New project", icon: plusIcon() }];

function addProject() {
  const value = `untitled-${projects.value.length - initialProjects.length + 1}`;
  projects.value = [
    ...projects.value,
    { value, label: value, description: `~/code/${value}`, icon: folderIcon() },
  ];
  project.value = value;
}
</script>

<template>
  <Picker
    v-model:value="project"
    label="Work in"
    placeholder="Search projects…"
    :items="projects"
    :actions="actions"
    @action="addProject"
  />
</template>
