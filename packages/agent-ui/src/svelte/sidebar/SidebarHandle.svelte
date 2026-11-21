<!-- The resize handle between the panel and the inset, named "Resize <label>". Absent while the panel is a drawer. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { KindResizableHandle } from "../internal/resizable/index.js";
  import { parts } from "./parts.js";

  type HandleProps = ComponentProps<typeof parts.Handle>;
  type Props = { [K in keyof HandleProps as K extends "children" | "class" ? never : K]: HandleProps[K] } & {
    /** Classes for the separator itself, UI SDK's Resizable handle. */
    class?: ClassValue;
  };

  let { class: className, ...props }: Props = $props();
</script>

<parts.Handle {...props}>
  {#snippet children(state: Parameters<NonNullable<HandleProps["children"]>>[0])}
    <KindResizableHandle aria-label={state["aria-label"]} class={className} data-agent-hidden="" />
  {/snippet}
</parts.Handle>
