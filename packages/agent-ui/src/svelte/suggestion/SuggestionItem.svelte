<!-- A suggestion in the Carousel: a `SuggestionChip` in its slide. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { KindCarouselItem } from "../internal/carousel/index.js";
  import type { parts } from "./parts.js";
  import SuggestionChip from "./SuggestionChip.svelte";

  let props: ComponentProps<typeof parts.Item> = $props();
</script>

<KindCarouselItem>
  <SuggestionChip {...props} />
</KindCarouselItem>
