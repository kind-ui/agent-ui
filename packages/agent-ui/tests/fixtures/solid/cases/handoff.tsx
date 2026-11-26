import type { HandoffOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { Handoff } from "../../../../src/solid/handoff.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { expose } from "../../shared/expose.js";
import { handoffs } from "../../shared/handoff.js";

function Handoffs() {
  const { host, approve, deny, always } = confirmationHost();
  const [rows, setRows] = createSignal(handoffs);
  onSettled(() => {
    expose({
      kindHost: host,
      kindHandoff: {
        set: (id: string, next: Partial<HandoffOptions>) => {
          setRows((all) => ({ ...all, [id]: { ...all[id], ...next } }));
        },
      },
    });
  });
  return (
    <div class="flex w-[34rem] flex-col gap-3 p-6">
      <For each={Object.keys(handoffs)} keyed={(id) => id}>
        {(id) => {
          const row = () => rows()[id()] ?? {};
          return (
            <Handoff
              id={id()}
              from={row().from}
              to={row().to}
              reason={row().reason}
              status={row().status}
              approval={row().approval}
              label={row().label}
              motion={row().motion}
              onApprove={row().approve ? approve : undefined}
              onDeny={row().approve ? deny : undefined}
              onAlwaysAllow={row().approve ? always : undefined}
            />
          );
        }}
      </For>
    </div>
  );
}

export const cases = {
  all: () => <Handoffs />,
};
