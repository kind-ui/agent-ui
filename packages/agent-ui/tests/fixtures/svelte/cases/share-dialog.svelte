<script module lang="ts">
  export const variants = ["all", "linked", "unconfirmed", "reduced", "refusing"];
</script>

<script lang="ts">
  import type { ShareDialogActionDetails, ShareVisibility } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { untrack } from "svelte";
  import { ShareDialog } from "../../../../src/svelte/share-dialog/index.js";
  import { expose } from "../../shared/expose.js";
  import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, call, answer } = shareDialogHost();
  const linked = untrack(() => variant === "linked");
  const refusing = $derived(variant === "refusing");
  const agentConfirm = $derived(variant === "unconfirmed" ? false : undefined);
  const motion = $derived(variant === "reduced" ? "reduced" : undefined);

  let visibility: ShareVisibility = $state(linked ? "link" : "private");
  let link: string | undefined = $state(linked ? shareLink : undefined);
  answer((action) => {
    if (action === "create") {
      link = shareLink;
      return;
    }
    link = undefined;
    visibility = "private";
  });
  expose({ kindHost: host });
</script>

<div class="max-w-[30rem] p-6">
  <ShareDialog
    id="share"
    bind:visibility={() => visibility, (next: ShareVisibility) => {
      if (!refusing) visibility = next;
    }}
    onVisibilityChange={(value: ShareVisibility, details: ChangeDetails<string>) => {
      host.visibilities.push({ value, reason: details.reason, source: details.source });
    }}
    {link}
    onCreateLink={(details: ShareDialogActionDetails) => call("create", details)}
    onRevoke={(details: ShareDialogActionDetails) => call("revoke", details)}
    onCopy={(value: string, details: ChangeDetails<string>) => host.copies.push({ link: value, reason: details.reason })}
    {agentConfirm}
    {motion}
  />
</div>
