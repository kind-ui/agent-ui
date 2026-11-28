import type { DiffFile } from "@kind-ui/agent-ui";
import { createMemo, createSignal, For, onSettled } from "solid-js";
import { Diff } from "../../../../src/solid/diff.js";
import { bigPatch, createDiffHost, files, frames, run, streamedSession } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

const noop = () => new Promise<void>(() => {});

function Frames() {
  return (
    <div class="flex w-[48rem] max-w-full flex-col gap-6 p-6">
      <For each={frames}>
        {(frame) => (
          <Diff id={frame.id} files={frame.files} defaultOpen={frame.open} onKeep={noop} onUndo={noop} />
        )}
      </For>
    </div>
  );
}

function Live(props: { initial: DiffFile[]; open?: string[] }) {
  const [list, setList] = createSignal(props.initial);
  let current = props.initial;
  const host = createDiffHost(
    () => current,
    (next) => {
      current = next;
      setList(next);
    },
  );
  onSettled(() => expose({ kindDiff: host.handle }));
  return (
    <div class="flex w-[48rem] max-w-full flex-col gap-4 p-6">
      <button type="button">Before</button>
      <Diff
        id="live"
        files={list()}
        defaultOpen={props.open}
        onKeep={host.onKeep}
        onUndo={host.onUndo}
        onOpenChange={host.onOpenChange}
      />
      <button type="button">After</button>
    </div>
  );
}

function Budget(props: { params: URLSearchParams }) {
  const count = Number(props.params.get("lines") ?? 10);
  const [extra, setExtra] = createSignal(0);
  onSettled(() => expose({ kindDiffStream: () => setExtra((n) => n + 1) }));
  const file = createMemo(() => bigPatch(count, extra()));
  return (
    <div class="w-[48rem] p-6">
      <Diff id="budget" files={[file()]} />
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
