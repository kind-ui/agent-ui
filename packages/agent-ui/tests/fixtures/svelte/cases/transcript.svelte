<script module lang="ts">
  export const variants = ["all", "plain", "refused", "many-100", "many-5000"];
</script>

<script lang="ts">
  import type { TranscriptSegment } from "@kind-ui/agent-ui";
  import type { TranscriptOptions } from "@kind-ui/agent-ui/core";
  import { Transcript } from "../../../../src/svelte/transcript/index.js";
  import { expose } from "../../shared/expose.js";
  import { manySegments, standup } from "../../shared/transcript.js";

  type Row = TranscriptOptions & { id: string; seekable?: boolean };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const first = (): Row[] => {
    if (variant === "plain") return [{ id: "plain", label: "Standup notes", segments: standup }];
    if (variant === "refused") return [{ id: "standup", segments: standup, query: "" }];
    if (variant.startsWith("many-")) {
      const segments = manySegments(Number(variant.slice(5)));
      return [{ id: "many", segments, seekable: true, motion: "none", query: "" }];
    }
    return [{ id: "standup", segments: standup, seekable: true }];
  };

  let rows: Row[] = $state.raw(first());
  const recorded: { seeks: [number, string][]; queries: [string, string][] } = { seeks: [], queries: [] };

  const update = (id: string, next: (row: Row) => Row) => {
    rows = rows.map((row) => (row.id === id ? next(row) : row));
  };

  expose({
    kindHost: recorded,
    kindTranscript: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      append: (id: string, segment: TranscriptSegment) =>
        update(id, (row) => ({ ...row, segments: [...(row.segments ?? []), segment] })),
    },
  });

  const seek = (time: number, details: { reason: string; source: string }) =>
    recorded.seeks.push([time, `${details.reason}:${details.source}`]);
</script>

<div class="flex w-[34rem] flex-col gap-3 p-6">
  <!-- An owned `query` changes only when the host sets it, as React's controlled prop does. -->
  {#each rows as { id, seekable, query, ...row } (id)}
    <Transcript
      {id}
      {...row}
      bind:query={() => query, () => {}}
      onQueryChange={(query, details) => recorded.queries.push([query, details.reason])}
      onSeek={seekable ? seek : undefined}
    />
  {/each}
</div>
