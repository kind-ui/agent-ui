import type { ActionOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Action } from "../../../../src/react/action.js";

type Row = Pick<ActionOptions, "status" | "motion" | "result">;

function Page() {
  const [row, setRow] = useState<Row>({ status: "running", result: "" });
  useEffect(() => {
    Object.assign(window, {
      kindAction: {
        set: (next: Partial<Row>) => setRow((current) => ({ ...current, ...next })),
        append: (chunk: string) => setRow((current) => ({ ...current, result: `${current.result}${chunk}` })),
      },
    });
  }, []);
  return (
    <div className="flex w-96 flex-col gap-4 p-6">
      <Action id="action" label="Explain" quote="Rate limits reset every hour." {...row} />
    </div>
  );
}

export const cases = { all: () => <Page /> };
