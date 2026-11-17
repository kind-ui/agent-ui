import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { FileTree } from "../../../../src/react/file-tree.js";
import { type FileTreeLog, entries as initial, nextEntries } from "../../shared/file-tree.js";

const log: FileTreeLog = { selected: [], values: [], expanded: [] };

function Page({
  motion,
  selectable = true,
  refuse,
}: {
  motion?: MotionMode;
  selectable?: boolean;
  refuse?: boolean;
}) {
  const [entries, setEntries] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindLog: log,
      kindHost: {
        add: () => setEntries(nextEntries.add),
        remove: () => setEntries(nextEntries.remove),
      },
    });
  }, []);
  return (
    <div className="w-[22rem] p-6">
      <FileTree
        id="file-tree"
        entries={entries}
        motion={motion}
        defaultExpanded={["src"]}
        onValueChange={(value, details) => {
          log.values.push(`${value} ${details.reason}`);
          if (refuse) details.cancel();
        }}
        onExpandedChange={(expanded, details) => {
          log.expanded.push(expanded);
          if (refuse) details.cancel();
        }}
        {...(selectable && {
          onSelect: (path, details) => log.selected.push(`${path} ${details.reason} ${details.source}`),
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
