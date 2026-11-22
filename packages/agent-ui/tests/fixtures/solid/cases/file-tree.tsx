import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { FileTree } from "../../../../src/solid/file-tree.js";
import { expose } from "../../shared/expose.js";
import { type FileTreeLog, entries as initial, nextEntries } from "../../shared/file-tree.js";

const log: FileTreeLog = { selected: [], values: [], expanded: [] };

function Page(props: { motion?: MotionMode; selectable?: boolean; refuse?: boolean }) {
  const [entries, setEntries] = createSignal(initial);
  onSettled(() =>
    expose({
      kindLog: log,
      kindHost: {
        add: () => setEntries(nextEntries.add),
        remove: () => setEntries(nextEntries.remove),
      },
    }),
  );
  return (
    <div class="w-[22rem] p-6">
      <FileTree
        id="file-tree"
        entries={entries()}
        motion={props.motion}
        defaultExpanded={["src"]}
        onValueChange={(value, details) => {
          log.values.push(`${value} ${details.reason}`);
          if (props.refuse) details.cancel();
        }}
        onExpandedChange={(expanded, details) => {
          log.expanded.push(expanded);
          if (props.refuse) details.cancel();
        }}
        {...(props.selectable !== false && {
          onSelect: (path: string, details: { reason: string; source: string }) =>
            log.selected.push(`${path} ${details.reason} ${details.source}`),
        })}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  static: () => <Page selectable={false} />,
  refused: () => <Page refuse />,
};
