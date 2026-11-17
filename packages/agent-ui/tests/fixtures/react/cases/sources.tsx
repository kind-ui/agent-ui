import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Sources } from "../../../../src/react/sources.js";
import { sources as initial, nextSources } from "../../shared/sources.js";

function Page({ motion, refuse }: { motion?: MotionMode; refuse?: boolean }) {
  const [openings, setOpenings] = useState<string[]>([]);
  const [sources, setSources] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        add: () => setSources(nextSources.add),
        rename: () => setSources(nextSources.rename),
        openings,
      },
    });
  }, [openings]);
  return (
    <div className="w-[30rem] p-6">
      <Sources
        id="sources"
        sources={sources}
        motion={motion}
        {...(refuse && {
          open: false,
          onOpenChange: (_open, details) => setOpenings((current) => [...current, details.reason]),
        })}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refused: () => <Page refuse />,
};
