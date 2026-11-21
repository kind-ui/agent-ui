<script lang="ts">
  import { Transcript } from "../components/ui/svelte/transcript/index.js";
</script>

<Transcript
  segments={[{ id: "1", speaker: "Priya", start: 0, end: 4, text: "Let's start with the checklist." }]}
  currentTime={1}
  onSeek={() => {}}
/>
