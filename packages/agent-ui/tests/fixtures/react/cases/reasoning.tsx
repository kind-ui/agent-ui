import type { ReasoningOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Reasoning } from "../../../../src/react/reasoning.js";

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
  const [rows, setRows] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindReasoning: {
        set: (id: string, next: Partial<Row>) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], ...next } as Row })),
        append: (id: string, chunk: string) =>
          setRows((all) => ({ ...all, [id]: { ...all[id], text: `${all[id]?.text}${chunk}` } as Row })),
      },
    });
  }, []);
  return (
    <div className="flex w-96 flex-col gap-4 p-6">
      {Object.entries(rows).map(([id, row]) => (
        <Reasoning key={id} id={id} {...row} />
      ))}
    </div>
  );
}

export const cases = { all: () => <All /> };
