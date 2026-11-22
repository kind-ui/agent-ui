<script module lang="ts">
  export const variants = ["box"];
</script>

<script lang="ts">
  import { enter, exit, layout } from "@kind-ui/agent-ui/core";
  import { expose } from "../../shared/expose.js";

  expose({ kindMotion: { enter, exit, layout } });
</script>

<div id="box" class="h-16 w-16 bg-[rgb(1,2,3)]"><span data-dot>.</span><span data-dot>.</span><span
    data-dot>.</span
  ></div>
