import type { TranscriptSegment } from "@kind-ui/agent-ui";
import type { TranscriptOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Transcript } from "../../../../src/react/transcript.js";
import { manySegments, standup } from "../../shared/transcript.js";

type Row = TranscriptOptions & { id: string; seekable?: boolean };

const recorded: { seeks: [number, string][]; queries: [string, string][] } = { seeks: [], queries: [] };

function Transcripts({ rows: first }: { rows: Row[] }) {
  const [rows, setRows] = useState(first);
  useEffect(() => {
    const update = (id: string, next: (row: Row) => Row) =>
      setRows((all) => all.map((row) => (row.id === id ? next(row) : row)));
    Object.assign(window, {
      kindHost: recorded,
      kindTranscript: {
        set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
        append: (id: string, segment: TranscriptSegment) =>
          update(id, (row) => ({ ...row, segments: [...(row.segments ?? []), segment] })),
      },
    });
  }, []);
  return (
    <div className="flex w-[34rem] flex-col gap-3 p-6">
      {rows.map(({ id, seekable, ...row }) => (
        <Transcript
          key={id}
          id={id}
          {...row}
          onQueryChange={(query, details) => recorded.queries.push([query, details.reason])}
          {...(seekable && {
            onSeek: (time, details) => recorded.seeks.push([time, `${details.reason}:${details.source}`]),
          })}
        />
      ))}
    </div>
  );
}

export const cases = {
  all: () => <Transcripts rows={[{ id: "standup", segments: standup, seekable: true }]} />,
  plain: () => <Transcripts rows={[{ id: "plain", label: "Standup notes", segments: standup }]} />,
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
