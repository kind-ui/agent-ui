<script module lang="ts">
  export const variants = ["all", "refused", "static", "reduced", "none"];
</script>

<script lang="ts">
  import type { SelectionActionItem } from "@kind-ui/agent-ui";
  import type { SelectionActionRun, SelectionOptions } from "@kind-ui/agent-ui/core";
  import { Selection } from "../../../../src/svelte/selection/index.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const actions: SelectionActionItem[] = [
    { id: "ask", label: "Ask" },
    { id: "quote", label: "Quote" },
    { id: "copy", label: "Copy", description: "Copy the selected text" },
  ];

  const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };
  expose({ kindHost: host });

  const refused = $derived(variant === "refused");
  const motion = $derived(variant === "reduced" ? "reduced" : variant === "none" ? "none" : undefined);

  const onAction: NonNullable<SelectionOptions["onAction"]> = ({ actionId, text }: SelectionActionRun, details) => {
    host.actions.push([actionId, text, details.reason, details.source]);
    if (refused) details.cancel();
  };
  const onDismiss: NonNullable<SelectionOptions["onDismiss"]> = (text, details) => {
    host.dismissals.push([text, details.reason, details.source]);
    if (refused) details.cancel();
  };
</script>

<div class="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
  <p id="before">Text before the reply, outside the selection root.</p
  ><button id="outside" type="button">Elsewhere</button
  ><Selection
    id="selection"
    {actions}
    {motion}
    onAction={variant === "static" ? undefined : onAction}
    {onDismiss}
  >
    <p id="reply">Rate limits reset every hour. Each response carries the remaining count in its headers.</p
    ><p id="reply-2">Back off exponentially when a request is refused.</p>
  </Selection
  ><p id="after">Text after the reply, outside the selection root.</p>
</div>
