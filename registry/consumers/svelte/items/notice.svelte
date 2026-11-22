<script lang="ts">
  import { Notice } from "../components/ui/svelte/notice/index.js";
</script>

<Notice variant="warning" label="Rate limited" onDismiss={() => {}}>
  Responses are slower for the next few minutes.
</Notice>
