import type { SelectionActionItem } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onSettled } from "solid-js";
import { Selection } from "../../../../src/solid/selection.js";
import { expose } from "../../shared/expose.js";

const actions: SelectionActionItem[] = [
  { id: "ask", label: "Ask" },
  { id: "quote", label: "Quote" },
  { id: "copy", label: "Copy", description: "Copy the selected text" },
];

const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };

function Page(props: { runnable?: boolean; refused?: boolean; motion?: MotionMode }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
      <p id="before">Text before the reply, outside the selection root.</p>
      <button id="outside" type="button">
        Elsewhere
      </button>
      <Selection
        id="selection"
        actions={actions}
        motion={props.motion}
        {...(props.runnable !== false && {
          onAction: ({ actionId, text }, details) => {
            host.actions.push([actionId, text, details.reason, details.source]);
            if (props.refused) details.cancel();
          },
        })}
        onDismiss={(text, details) => {
          host.dismissals.push([text, details.reason, details.source]);
          if (props.refused) details.cancel();
        }}
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

export const cases = {
  all: () => <Page />,
  refused: () => <Page refused />,
  static: () => <Page runnable={false} />,
  reduced: () => <Page motion="reduced" />,
  none: () => <Page motion="none" />,
};
