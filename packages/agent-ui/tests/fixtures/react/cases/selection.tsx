import type { SelectionActionItem } from "@kind-ui/agent-ui";
import { useEffect } from "react";
import { Selection } from "../../../../src/react/selection.js";

const actions: SelectionActionItem[] = [
  { id: "ask", label: "Ask" },
  { id: "quote", label: "Quote" },
  { id: "copy", label: "Copy", description: "Copy the selected text" },
];

const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };

function Page() {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
      <p id="before">Text before the reply, outside the selection root.</p>
      <Selection
        id="selection"
        actions={actions}
        onAction={({ actionId, text }, details) =>
          host.actions.push([actionId, text, details.reason, details.source])
        }
        onDismiss={(text, details) => host.dismissals.push([text, details.reason, details.source])}
      >
        <p id="reply">
          Rate limits reset every hour. Each response carries the remaining count in its headers.
        </p>
        <p id="reply-2">Back off exponentially when a request is refused.</p>
      </Selection>
      <p id="after">Text after the reply, outside the selection root.</p>
    </div>
  );
}

export const cases = { all: () => <Page /> };
