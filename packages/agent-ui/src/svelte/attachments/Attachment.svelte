<!--
  One chip: an image's preview or a file icon, the name, the size or error, and a remove button. Written without
  whitespace between them, which would join the chip's text.
-->
<script lang="ts">
  import type { AttachmentState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let props: Omit<ComponentProps<typeof parts.Item>, "children"> = $props();
</script>

<parts.Item {...props}>
  {#snippet children({ item, preview, detail }: AttachmentState)}{#if preview}<img
        data-preview=""
        src={preview}
        alt=""
      />{:else}<span data-icon=""></span>{/if}<span data-name="">{item?.name}</span><span data-detail="">{detail}</span
    ><parts.Remove value={props.value} />{/snippet}
</parts.Item>
