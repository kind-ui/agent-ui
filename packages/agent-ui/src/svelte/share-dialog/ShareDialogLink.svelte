<!-- The `link`, in a read-only UI SDK Input, unless you pass children. -->
<script lang="ts">
  import type { ShareDialogLinkState } from "@kind-ui/agent-ui/core";
  import { Input } from "@ui-sdk/svelte/input";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  type Props = ComponentProps<typeof parts.Link> & { children?: Snippet<[ShareDialogLinkState]> };

  let { children: content, ...props }: Props = $props();
</script>

<parts.Link {...props}>
  {#snippet children(input: ShareDialogLinkState)}
    {#if content}{@render content(input)}{:else}
      <Input value={input.value} readOnly={input.readOnly} aria-label={input["aria-label"]} data-agent-hidden="" />
    {/if}
  {/snippet}
</parts.Link>
