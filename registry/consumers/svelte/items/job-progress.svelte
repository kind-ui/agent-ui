<script lang="ts">
  import { JobProgress } from "../components/ui/svelte/job-progress/index.js";
</script>

<JobProgress label="Build docs" status="running" value={0.42} stage="Installing dependencies" defaultOpen>
  <pre>$ npm ci</pre>
</JobProgress>
