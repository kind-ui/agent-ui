import type { ActionOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Action } from "../../../../src/react/action.js";

type Row = Pick<ActionOptions, "status" | "result" | "open">;

const host = { openings: [] as unknown[][] };

function Page({ owned = false }: { owned?: boolean }) {
  const [row, setRow] = useState<Row>({ status: "running", result: "", ...(owned && { open: true }) });
  useEffect(() => {
    Object.assign(window, {
      kindHost: host,
      kindAction: {
        set: (next: Partial<Row>) => setRow((current) => ({ ...current, ...next })),
        append: (chunk: string) => setRow((current) => ({ ...current, result: `${current.result}${chunk}` })),
      },
    });
  }, []);
  return (
    <div className="flex w-96 flex-col gap-4 p-6">
      <Action
        id="action"
        label="Explain"
        quote={"Rate limits reset every hour.\n\n"}
        {...row}
        {...(owned && { onOpenChange: (open, details) => host.openings.push([open, details.reason]) })}
      />
    </div>
  );
}

export const cases = { all: () => <Page />, owned: () => <Page owned /> };
