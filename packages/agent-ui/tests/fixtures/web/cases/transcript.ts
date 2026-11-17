import type { TranscriptSegment } from "@kind-ui/agent-ui";
import type { TranscriptOptions } from "@kind-ui/agent-ui/core";
import { defineTranscript } from "../../../../src/web/transcript.js";
import { manySegments, standup } from "../../shared/transcript.js";

type Row = TranscriptOptions & { id: string; seekable?: boolean; refused?: boolean };

const transcripts = (rows: Row[]) => (root: HTMLElement) => {
  defineTranscript();
  const recorded: { seeks: [number, string][]; queries: [string, string][] } = { seeks: [], queries: [] };
  const list = document.createElement("div");
  list.className = "flex w-[34rem] flex-col gap-3 p-6";
  for (const { id, seekable, refused, ...row } of rows) {
    const transcript = document.createElement("kind-transcript");
    transcript.id = id;
    Object.assign(transcript, row);
    transcript.canSeek = seekable ?? false;
    transcript.addEventListener("querychange", (event) => {
      recorded.queries.push([event.detail.value, event.detail.reason]);
      if (refused) event.preventDefault();
    });
    transcript.addEventListener("seek", (event) =>
      recorded.seeks.push([event.detail.value, `${event.detail.reason}:${event.detail.source}`]),
    );
    list.append(transcript);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-transcript"];
  Object.assign(window, {
    kindHost: recorded,
    kindTranscript: {
      set: (id: string, next: Partial<Row>) => Object.assign(element(id), next),
      append: (id: string, segment: TranscriptSegment) => {
        element(id).segments = [...(element(id).segments ?? []), segment];
      },
    },
  });
};

export const cases = {
  all: transcripts([{ id: "standup", segments: standup, seekable: true }]),
  plain: transcripts([{ id: "plain", label: "Standup notes", segments: standup }]),
  refused: transcripts([{ id: "standup", segments: standup, refused: true }]),
  "many-100": transcripts([
    { id: "many", segments: manySegments(100), seekable: true, motion: "none", query: "" },
  ]),
  "many-5000": transcripts([
    { id: "many", segments: manySegments(5000), seekable: true, motion: "none", query: "" },
  ]),
};
