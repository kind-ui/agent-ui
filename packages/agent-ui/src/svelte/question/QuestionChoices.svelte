<!-- A radio group for a single choice or a checkbox group for a multiple one, unless you pass children. -->
<script lang="ts">
  import type { QuestionOption } from "@kind-ui/agent-ui";
  import type { QuestionChoicesState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindCheckbox, KindCheckboxGroup, KindCheckboxIndicator } from "../internal/checkbox/index.js";
  import { KindRadio, KindRadioGroup, KindRadioIndicator } from "../internal/radio/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Choices> = $props();
</script>

{#snippet option(kind: "single" | "multiple", option: QuestionOption)}
  <!-- svelte-ignore a11y_label_has_associated_control: the label wraps UI SDK's radio or checkbox, which it names. -->
  <label data-question-option="">
    {#if kind === "single"}
      <KindRadio value={option.value}>
        <KindRadioIndicator />
      </KindRadio>
    {:else}
      <KindCheckbox value={option.value}>
        <KindCheckboxIndicator>
          <!-- Lucide's check, as the status mark draws it. -->
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </KindCheckboxIndicator>
      </KindCheckbox>
    {/if}<span data-question-option-text=""
    >
      <span>{option.label}</span
      >{#if option.description}<span data-question-option-description="">{option.description}</span>{/if}
    </span>
  </label>
{/snippet}

<!-- Part state is a proxy that only reads properties, so `"kind" in state` is always false. -->
{#snippet defaultChoices(partState: QuestionChoicesState | Record<string, never>)}
  {@const state = partState as QuestionChoicesState}
  {#if state.kind}
    {#if state.kind === "single"}
      <KindRadioGroup
        aria-labelledby={state.labelledBy}
        controller={state.controller}
        defaultValue={state.defaultValue}
        readOnly={state.readOnly}
      >
        {#each state.options as item (item.value)}{@render option("single", item)}{/each}
      </KindRadioGroup>
    {:else}
      <KindCheckboxGroup controller={state.controller} defaultValue={state.defaultValue} readOnly={state.readOnly}>
        {#each state.options as item (item.value)}{@render option("multiple", item)}{/each}
      </KindCheckboxGroup>
    {/if}
  {/if}
{/snippet}

<parts.Choices {...props} children={children ?? defaultChoices} />
