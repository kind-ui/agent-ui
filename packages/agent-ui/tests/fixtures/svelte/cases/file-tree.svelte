<script module lang="ts">
  export const variants = ["all", "reduced", "static", "refused"];
</script>

<script lang="ts">
  import type { FileTreeEntry } from "@kind-ui/agent-ui";
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { FileTree } from "../../../../src/svelte/file-tree/index.js";
  import { expose } from "../../shared/expose.js";
  import { type FileTreeLog, entries as initial, nextEntries } from "../../shared/file-tree.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const log: FileTreeLog = { selected: [], values: [], expanded: [] };

  let entries: FileTreeEntry[] = $state.raw(initial);
  const motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);
  const selectable = $derived(variant !== "static");
  const refuse = $derived(variant === "refused");

  expose({
    kindLog: log,
    kindHost: {
      add: () => (entries = nextEntries.add(entries)),
      remove: () => (entries = nextEntries.remove(entries)),
    },
  });
</script>

<div class="w-[22rem] p-6">
  <FileTree
    id="file-tree"
    {entries}
    {motion}
    defaultExpanded={["src"]}
    onValueChange={(value, details) => {
      log.values.push(`${value} ${details.reason}`);
      if (refuse) details.cancel();
    }}
    onExpandedChange={(expanded, details) => {
      log.expanded.push(expanded);
      if (refuse) details.cancel();
    }}
    onSelect={selectable
      ? (path, details) => log.selected.push(`${path} ${details.reason} ${details.source}`)
      : undefined}
  />
</div>
