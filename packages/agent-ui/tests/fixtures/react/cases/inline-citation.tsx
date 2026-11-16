import type { MotionMode } from "@kind-ui/agent-ui/core";
import { InlineCitation } from "../../../../src/react/inline-citation.js";
import { lateSource, sources } from "../../shared/sources.js";

function Page({ motion }: { motion?: MotionMode }) {
  return (
    <div className="w-[40rem] p-6 text-sm leading-6">
      <p id="prose">
        Back off when you hit a limit <InlineCitation id="many" sources={sources} motion={motion} /> and read
        the header <InlineCitation id="one" sources={[lateSource]} label="1" motion={motion} />.
      </p>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
};
