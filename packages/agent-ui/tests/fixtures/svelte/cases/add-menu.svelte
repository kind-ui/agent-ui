<script module lang="ts">
  export const variants = ["all", "reduced", "refusing", "inert"];
</script>

<script lang="ts">
  import type { AddMenuActionReason } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { AddMenu } from "../../../../src/svelte/add-menu/index.js";
  import { addItems, addMenuHost } from "../../shared/add-menu.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, action } = addMenuHost();
  expose({ kindHost: host });
</script>

<div class="p-6">
  <AddMenu
    id="add"
    items={addItems}
    onAction={variant === "inert"
      ? undefined
      : (id: string, details: ChangeDetails<AddMenuActionReason>) => {
          action(id, details);
          if (variant === "refusing") details.cancel();
        }}
    motion={variant === "reduced" ? "reduced" : undefined}
  />
</div>
