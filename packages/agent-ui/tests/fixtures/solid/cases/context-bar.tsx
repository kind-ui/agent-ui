import type { ContextChip } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import { createSignal, onSettled } from "solid-js";
import { ContextBar } from "../../../../src/solid/context-bar.js";
import { contextChips, contextHost } from "../../shared/context-bar.js";
import { expose } from "../../shared/expose.js";

const { host, record } = contextHost();

function Page(props: { count?: number; motion?: MotionMode; refusing?: boolean }) {
  const count = () => props.count ?? 6;
  const [chips, setChips] = createSignal<ContextChip<string>[]>(contextChips(props.count ?? 6));
  onSettled(() => {
    let added = count();
    expose({
      kindHost: host,
      kindContext: {
        add: () => {
          added++;
          setChips((all) => [
            ...all,
            { id: `added-${added}`, label: `notes/added-${added}.md and more`, kind: "file" },
          ]);
        },
      },
    });
  });
  return (
    <div class="p-6" style={{ width: "360px", "box-sizing": "content-box" }}>
      <ContextBar
        id="context"
        chips={chips()}
        motion={props.motion}
        style={{ "--kind-context-chip-max-width": "120px" } as JSX.CSSProperties}
        onRemove={(id, details) => {
          record(id, details);
          if (props.refusing) details.cancel();
          else setChips((all) => all.filter((chip) => chip.id !== id));
        }}
      />
      <textarea id="below" aria-label="Message" />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  none: () => <Page motion="none" />,
  refusing: () => <Page refusing />,
  written: () => <Page />,
  "many-10": () => <Page count={10} />,
  "many-200": () => <Page count={200} />,
};
