<!--
  A recurring run: its name and schedule, when it runs next and how it last ran, an Enabled switch, Run now and Edit.
  Any `children` replace the parts. To arrange the parts yourself, use `ScheduleCardRoot`.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ScheduleCardDescription from "./ScheduleCardDescription.svelte";
  import ScheduleCardEnabled from "./ScheduleCardEnabled.svelte";
  import ScheduleCardLast from "./ScheduleCardLast.svelte";
  import ScheduleCardNext from "./ScheduleCardNext.svelte";
  import ScheduleCardRunNow from "./ScheduleCardRunNow.svelte";
  import ScheduleCardTitle from "./ScheduleCardTitle.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet defaults()}<parts.Icon /><ScheduleCardTitle /><ScheduleCardDescription /><ScheduleCardNext
  /><ScheduleCardLast /><ScheduleCardEnabled /><ScheduleCardRunNow /><parts.Edit />{/snippet}

<parts.Root {...props} children={children ?? defaults} />
