import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Sources } from "../../../../src/react/sources.js";
import { sources as initial, nextSources } from "../../shared/sources.js";

function Page({ motion }: { motion?: MotionMode }) {
  const [sources, setSources] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        add: () => setSources(nextSources.add),
        rename: () => setSources(nextSources.rename),
      },
    });
  }, []);
  return (
    <div className="w-[30rem] p-6">
      <Sources id="sources" sources={sources} motion={motion} />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
};
