import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { InlineCitation } from "../../../../src/react/inline-citation.js";
import { lateSource, sources } from "../../shared/sources.js";

function Page({ motion, refuse }: { motion?: MotionMode; refuse?: boolean }) {
  const [openings, setOpenings] = useState<string[]>([]);
  useEffect(() => {
    Object.assign(window, { kindHost: { openings } });
  }, [openings]);
  return (
    <div className="w-[40rem] p-6 text-sm leading-6">
      <p id="prose">
        Back off when you hit a limit <InlineCitation id="many" sources={sources} motion={motion} /> and read
        the header{" "}
        <InlineCitation
          id="one"
          sources={[lateSource]}
          label="1"
          motion={motion}
          {...(refuse && {
            open: false,
            onOpenChange: (_open, details) => setOpenings((current) => [...current, details.reason]),
          })}
        />
        .
      </p>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refused: () => <Page refuse />,
};
