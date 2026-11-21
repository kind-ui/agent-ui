<script lang="ts">
  import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "../components/ui/svelte/composer/index.js";
</script>

<Composer aria-label="Message">
  <ComposerInput aria-label="Prompt" />
  <ComposerSubmit />
  <ComposerStop />
</Composer>
