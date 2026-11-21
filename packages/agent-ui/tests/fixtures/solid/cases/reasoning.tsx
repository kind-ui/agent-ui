import type { ReasoningOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Reasoning } from "../../../../src/solid/reasoning.js";
import { expose } from "../../shared/expose.js";

type Row = Pick<ReasoningOptions, "status" | "durationSeconds" | "motion" | "label"> & { text: string };

const initial: Record<string, Row> = {
  live: { status: "running", text: "" },
  cached: { status: "pending", text: "Answered from the cache." },
  done: {
    status: "complete",
    durationSeconds: 3,
    text: "Compared **three** sources. Collapsed text: kumquat.",
  },
};

function All() {
  const [rows, setRows] = createSignal(initial);
  onSettled(() =>
    expose({
      kindReasoning: {
        set: (id: string, next: Partial<Row>) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], ...next } as Row })),
        append: (id: string, chunk: string) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], text: `${all[id]?.text}${chunk}` } as Row })),
      },
    }),
  );
  return (
    <div class="flex w-96 flex-col gap-4 p-6">
      <For each={Object.entries(rows())} keyed={(entry) => entry[0]}>
        {(entry) => (
          <Reasoning
            id={entry()[0]}
            status={entry()[1].status}
            durationSeconds={entry()[1].durationSeconds}
            motion={entry()[1].motion}
            label={entry()[1].label}
            text={entry()[1].text}
          />
        )}
      </For>
    </div>
  );
}

export const cases = { all: () => <All /> };
