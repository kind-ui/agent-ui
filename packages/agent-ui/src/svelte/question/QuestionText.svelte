<!-- A text box for a text question, unless you pass children. Enter adds a line; it never submits. -->
<script lang="ts">
  import type { QuestionTextState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindTextarea } from "../internal/textarea/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Text> = $props();
</script>

<!-- Part state is a proxy that only reads properties, so `"controller" in state` is always false. -->
{#snippet defaultText(partState: QuestionTextState | Record<string, never>)}
  {@const state = partState as QuestionTextState}
  {#if state.controller}
    <KindTextarea
      controller={state.controller}
      defaultValue={state.defaultValue}
      readOnly={state.readOnly}
      placeholder={state.placeholder}
      aria-label={state.label}
      rows={3}
    />
  {/if}
{/snippet}

<parts.Text {...props} children={children ?? defaultText} />
