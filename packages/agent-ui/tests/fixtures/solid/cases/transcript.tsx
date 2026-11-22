import type { TranscriptSegment } from "@kind-ui/agent-ui";
import type { TranscriptOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Transcript } from "../../../../src/solid/transcript.js";
import { expose } from "../../shared/expose.js";
import { manySegments, standup } from "../../shared/transcript.js";

type Row = TranscriptOptions & { id: string; seekable?: boolean };

const recorded: { seeks: [number, string][]; queries: [string, string][] } = { seeks: [], queries: [] };

const onSeek: TranscriptOptions["onSeek"] = (time, details) =>
  recorded.seeks.push([time, `${details.reason}:${details.source}`]);

function Transcripts(props: { rows: Row[] }) {
  const [rows, setRows] = createSignal(props.rows);
  onSettled(() => {
    const update = (id: string, next: (row: Row) => Row) => {
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    };
    expose({
      kindHost: recorded,
      kindTranscript: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, segment: TranscriptSegment) =>
          update(id, (row) => ({ ...row, segments: [...(row.segments ?? []), segment] })),
      },
    });
  });
  return (
    <div class="flex w-[34rem] flex-col gap-3 p-6">
      <For each={rows()} keyed={(row) => row.id}>
        {(row) => (
          <Transcript
            id={row().id}
            label={row().label}
            segments={row().segments}
            currentTime={row().currentTime}
            query={row().query}
            follow={row().follow}
            motion={row().motion}
            onQueryChange={(query, details) => recorded.queries.push([query, details.reason])}
            onSeek={row().seekable ? onSeek : undefined}
          />
        )}
      </For>
    </div>
  );
}

export const cases = {
  all: () => <Transcripts rows={[{ id: "standup", segments: standup, seekable: true }]} />,
  plain: () => <Transcripts rows={[{ id: "plain", label: "Standup notes", segments: standup }]} />,
  refused: () => <Transcripts rows={[{ id: "standup", segments: standup, query: "" }]} />,
  "many-100": () => (
    <Transcripts
      rows={[{ id: "many", segments: manySegments(100), seekable: true, motion: "none", query: "" }]}
    />
  ),
  "many-5000": () => (
    <Transcripts
      rows={[{ id: "many", segments: manySegments(5000), seekable: true, motion: "none", query: "" }]}
    />
  ),
};
