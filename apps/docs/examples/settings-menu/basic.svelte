<script lang="ts">
  import type { SettingsValues } from "@kind-ui/agent-ui";
  import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import { SettingsMenu, type SettingsMenuSetting } from "@/components/ui/svelte/settings-menu/index.js";

  const settings: SettingsMenuSetting[] = [
    {
      type: "toggle",
      id: "search",
      label: "Web search",
      description: "Look things up before answering",
    },
    { type: "toggle", id: "memory", label: "Memory" },
    {
      type: "choice",
      id: "style",
      label: "Response style",
      options: [
        { value: "concise", label: "Concise" },
        { value: "balanced", label: "Balanced" },
        { value: "detailed", label: "Detailed" },
      ],
    },
  ];

  let values: SettingsValues = $state.raw({ search: true, memory: false, style: "balanced" });
</script>

<Composer aria-label="Message" onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1000))}>
  <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
  <SettingsMenu style="grid-area: attach" {settings} bind:values />
  <ComposerSubmit />
</Composer>
