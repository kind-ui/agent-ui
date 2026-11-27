import type { DiffFile } from "@kind-ui/agent-ui";
import { useMemo, useState } from "react";
import { Diff } from "../../../../src/react/diff.js";
import { bigPatch, createDiffHost, files, frames, run, streamedSession } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

const noop = () => new Promise<void>(() => {});

function Frames() {
  return (
    <div className="flex w-[48rem] max-w-full flex-col gap-6 p-6">
      {frames.map((frame) => (
        <Diff
          key={frame.id}
          id={frame.id}
          files={frame.files}
          defaultOpen={frame.open}
          onKeep={noop}
          onUndo={noop}
        />
      ))}
    </div>
  );
}

function Live({ initial, open }: { initial: DiffFile[]; open?: string[] }) {
  const [list, setList] = useState(initial);
  const host = useMemo(() => {
    let current = initial;
    const made = createDiffHost(
      () => current,
      (next) => {
        current = next;
        setList(next);
      },
    );
    expose({ kindDiff: made.handle });
    return made;
  }, [initial]);
  return (
    <div className="flex w-[48rem] max-w-full flex-col gap-4 p-6">
      <button type="button">Before</button>
      <Diff
        id="live"
        files={list}
        defaultOpen={open}
        onKeep={host.onKeep}
        onUndo={host.onUndo}
        onOpenChange={host.onOpenChange}
      />
      <button type="button">After</button>
    </div>
  );
}

function Budget({ params }: { params: URLSearchParams }) {
  const count = Number(params.get("lines") ?? 10);
  const [extra, setExtra] = useState(0);
  expose({ kindDiffStream: () => setExtra((n) => n + 1) });
  const file = useMemo(() => bigPatch(count, extra), [count, extra]);
  return (
    <div className="w-[48rem] p-6">
      <Diff id="budget" files={[file]} />
    </div>
  );
}

export const cases = {
  all: () => <Frames />,
  live: () => <Live initial={run} open={[files.signIn.path]} />,
  single: () => <Live initial={[files.packageJson]} />,
  stream: () => <Live initial={[files.signIn, streamedSession(4)]} open={[files.session.path]} />,
  budget: (params: URLSearchParams) => <Budget params={params} />,
};
