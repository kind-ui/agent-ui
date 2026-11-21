<script lang="ts">
  import { Status } from "@/components/ui/svelte/status/index.js";
</script>

<ul class="flex w-72 flex-col gap-2 text-sm">
  <li class="flex items-center justify-between gap-3">
    Build
    <Status status="complete" />
  </li>
  <li class="flex items-center justify-between gap-3">
    Deploy to staging
    <Status status="running" />
  </li>
  <li class="flex items-center justify-between gap-3">
    Approve release
    <Status status="awaiting-input" />
  </li>
</ul>
