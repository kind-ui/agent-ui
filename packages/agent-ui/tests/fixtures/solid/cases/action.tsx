import type { ActionOptions } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Action } from "../../../../src/solid/action.js";
import { expose } from "../../shared/expose.js";

type Row = Pick<ActionOptions, "status" | "result" | "open">;

const host = { openings: [] as unknown[][] };

function Page(props: { owned?: boolean }) {
  const [row, setRow] = createSignal<Row>({
    status: "running",
    result: "",
    ...(props.owned && { open: true }),
  });
  onSettled(() =>
    expose({
      kindHost: host,
      kindAction: {
        set: (next: Partial<Row>) => setRow((current) => ({ ...current, ...next })),
        append: (chunk: string) => setRow((current) => ({ ...current, result: `${current.result}${chunk}` })),
      },
    }),
  );
  return (
    <div class="flex w-96 flex-col gap-4 p-6">
      <Action
        id="action"
        label="Explain"
        quote={"Rate limits reset every hour.\n\n"}
        status={row().status}
        result={row().result}
        open={props.owned ? row().open : undefined}
        onOpenChange={props.owned ? (open, details) => host.openings.push([open, details.reason]) : undefined}
      />
    </div>
  );
}

export const cases = { all: () => <Page />, owned: () => <Page owned /> };
