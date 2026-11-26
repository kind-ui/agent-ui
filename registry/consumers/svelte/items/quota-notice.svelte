<script lang="ts">
  import { QuotaNotice } from "../components/ui/svelte/quota-notice/index.js";
</script>

<QuotaNotice used={800} limit={1000} period="this month" />
