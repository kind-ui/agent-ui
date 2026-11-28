<!-- The loss sentence, then the note, as the dialog's description, so both are read as it opens. -->
<script lang="ts">
  import type { CheckpointDialogState } from "@kind-ui/agent-ui/core";
  import { KindAlertDialogDescription } from "../internal/alert-dialog/index.js";

  let { description, note }: Pick<CheckpointDialogState, "description" | "note"> = $props();
</script>

<KindAlertDialogDescription data-checkpoint-loss=""
  ><span data-checkpoint-loss-text="">{description}</span><span data-checkpoint-note="">{note}</span
  ></KindAlertDialogDescription>
