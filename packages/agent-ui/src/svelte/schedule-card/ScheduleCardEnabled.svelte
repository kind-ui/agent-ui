<!-- "Enabled" and a UI SDK Switch showing `schedule.enabled`, unless you pass a `children` snippet. -->
<script lang="ts">
  import type { ScheduleCardEnabledState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { KindSwitch, KindSwitchThumb } from "../internal/switch/index.js";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Enabled> = $props();

  // The primitive owns `checked`: a Svelte component keeps a change to a prop that isn't bound, so it's bound to a
  // setter that keeps nothing, and the new value arrives with the host's next schedule.
  const keep = () => {};
</script>

<!-- Hidden from agents, which use the Schedule Card's own `setEnabled`. -->
{#snippet control(state: ScheduleCardEnabledState)}{state.label}<KindSwitch
    bind:checked={() => state.checked, keep}
    onCheckedChange={state.onCheckedChange}
    aria-label={state["aria-label"]}
    data-agent-hidden=""><KindSwitchThumb /></KindSwitch
  >{/snippet}

<parts.Enabled {...props} children={children ?? control} />
