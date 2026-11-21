<script lang="ts">
  import type { EffortLevel, SettingsValues } from "@kind-ui/agent-ui";
  import {
    ModelControl,
    type ModelControlModel,
  } from "@/components/ui/svelte/model-control/index.js";
  import type { SettingsMenuSetting } from "@/components/ui/svelte/settings-menu/index.js";
  import { AnthropicLogo, MicrosoftLogo, OpenAILogo } from "../model-selector/logos.svelte";

  const models: ModelControlModel[] = [
    { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: AnthropicLogo },
    { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: AnthropicLogo },
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: OpenAILogo },
    { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", group: "OpenAI", icon: OpenAILogo, efforts: ["low", "medium"] },
    { id: "mai-code-2-flash", name: "MAI Code 2 Flash", group: "Microsoft", icon: MicrosoftLogo, efforts: [] },
  ];

  const moreModels: ModelControlModel[] = [
    { id: "mai-code-2", name: "MAI Code 2", group: "Microsoft", icon: MicrosoftLogo },
  ];

  const levels: EffortLevel[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "xhigh", label: "Extra High" },
    { value: "max", label: "Max" },
  ];

  const settings: SettingsMenuSetting[] = [
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

  let model: string | null = $state("claude-opus-5.5");
  let effort = $state("medium");
  let values: SettingsValues = $state.raw({ fast: false, context: "1m" });
  let showAll = $state(false);
</script>

<ModelControl
  models={showAll ? [...models, ...moreModels] : models}
  bind:model
  {levels}
  bind:effort
  {settings}
  bind:values
  actions={showAll ? undefined : actions}
  onAction={showAll ? undefined : () => (showAll = true)}
/>
