import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onSettled } from "solid-js";
import { InlineCitation } from "../../../../src/solid/inline-citation.js";
import { expose } from "../../shared/expose.js";
import { lateSource, sources } from "../../shared/sources.js";

function Page(props: { motion?: MotionMode; refuse?: boolean }) {
  const openings: string[] = [];
  onSettled(() => expose({ kindHost: { openings } }));
  return (
    <div class="w-[40rem] p-6 text-sm leading-6">
      <p id="prose">
        Back off when you hit a limit <InlineCitation id="many" sources={sources} motion={props.motion} /> and
        read the header{" "}
        <InlineCitation
          id="one"
          sources={[lateSource]}
          label="1"
          motion={props.motion}
          {...(props.refuse
            ? {
                open: false,
                onOpenChange: (_open: boolean, details: { reason: string }) => openings.push(details.reason),
              }
            : {})}
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
