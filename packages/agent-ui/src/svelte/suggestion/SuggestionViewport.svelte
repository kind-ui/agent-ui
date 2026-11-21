<!-- The row that scrolls, holding the suggestions. -->
<script lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { KindCarouselContent, KindCarouselViewport } from "../internal/carousel/index.js";

  type Props = Omit<ComponentProps<typeof KindCarouselViewport>, "children"> & { children?: Snippet };

  let { children, ...props }: Props = $props();
</script>

<KindCarouselViewport {...props}>
  <KindCarouselContent>{@render children?.()}</KindCarouselContent>
</KindCarouselViewport>
