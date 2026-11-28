<!--
  "Restore" and a radio per scope, unless you pass children: a snippet that gets the Radio group's props. Rendered
  only while the host offers more than one scope.
-->
<script lang="ts">
  import type { CheckpointScopeState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindRadio, KindRadioGroup, KindRadioIndicator } from "../internal/radio/index.js";
  import { parts } from "./parts.js";

  // The Radio group takes any string; core keeps its controller to the scopes.
  type Controller = ComponentProps<typeof KindRadioGroup>["controller"];

  let { children, ...props }: ComponentProps<typeof parts.Scope> = $props();
</script>

{#snippet fallback({ controller, defaultValue, options, label }: CheckpointScopeState)}<span
    aria-hidden="true"
    data-checkpoint-scope-label="">{label}</span
  ><KindRadioGroup controller={controller as Controller} {defaultValue} aria-label={label} data-agent-hidden=""
    >{#each options as option (option.value)}<!-- svelte-ignore a11y_label_has_associated_control: the label wraps UI SDK's radio, which it names. --><label
          data-checkpoint-option=""
          ><KindRadio value={option.value}><KindRadioIndicator /></KindRadio
          >{option.label}</label
        >{/each}</KindRadioGroup
  >{/snippet}

<parts.Scope {...props} children={children ?? fallback} />
