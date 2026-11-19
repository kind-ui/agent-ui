import type { MotionMode } from "@kind-ui/agent-ui/core";
import { type CSSProperties, useEffect, useState } from "react";
import { ContextBar } from "../../../../src/react/context-bar.js";
import { contextChips, contextHost } from "../../shared/context-bar.js";

const { host, record } = contextHost();

function Page({ count = 6, motion, refusing }: { count?: number; motion?: MotionMode; refusing?: boolean }) {
  const [chips, setChips] = useState(() => contextChips(count));
  useEffect(() => {
    let added = count;
    Object.assign(window, {
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
  }, [count]);
  return (
    <div className="p-6" style={{ width: 360, boxSizing: "content-box" }}>
      <ContextBar
        id="context"
        chips={chips}
        motion={motion}
        style={{ "--kind-context-chip-max-width": "120px" } as CSSProperties}
        onRemove={(id, details) => {
          record(id, details);
          if (refusing) details.cancel();
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
