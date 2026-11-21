<script lang="ts">
  import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import { ModelSelector } from "@/components/ui/svelte/model-selector/index.js";
  import { ReasoningEffort } from "@/components/ui/svelte/reasoning-effort/index.js";
  import { AnthropicLogo, GoogleMonogram, MicrosoftLogo, OpenAILogo, XAILogo } from "./logos.svelte";

  const models = [
    {
      id: "claude-opus-5.5",
      name: "Claude Opus 5.5",
      group: "Anthropic",
      description: "Not on your plan",
      disabled: true,
      icon: AnthropicLogo,
    },
    { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: AnthropicLogo },
    { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", description: "Deep reasoning", icon: OpenAILogo },
    {
      id: "gpt-6.1-terra",
      name: "GPT-6.1 Terra",
      group: "OpenAI",
      description: "Fast and affordable",
      icon: OpenAILogo,
    },
    { id: "mai-code-2", name: "MAI Code 2", group: "Microsoft", description: "Built for code", icon: MicrosoftLogo },
    {
      id: "gemini-4-argon",
      name: "Gemini 4 Argon",
      group: "Google",
      description: "Long context",
      icon: GoogleMonogram,
    },
  ];

  const moreModels = [
    { id: "gpt-6-astra", name: "GPT-6 Astra", group: "OpenAI", icon: OpenAILogo },
    { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", group: "OpenAI", icon: OpenAILogo },
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", group: "Google", icon: GoogleMonogram },
    { id: "grok-4.7", name: "Grok 4.7", group: "xAI", icon: XAILogo },
  ];

  const actions = [{ id: "more", label: "More models" }];

  let model = $state<string | null>("claude-sonnet-5.5");
  let effort = $state<string | null>("medium");
  let showAll = $state(false);
</script>

<Composer aria-label="Message" class="w-full max-w-xl" onSubmit={() => undefined}>
  <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
  <div class="flex min-w-0 flex-wrap items-center gap-2" style="grid-area: attach">
    <ModelSelector
      models={showAll ? [...models, ...moreModels] : models}
      bind:value={model}
      actions={showAll ? undefined : actions}
      onAction={showAll ? undefined : () => (showAll = true)}
    />
    <ReasoningEffort bind:value={effort} />
  </div>
  <ComposerSubmit />
</Composer>
