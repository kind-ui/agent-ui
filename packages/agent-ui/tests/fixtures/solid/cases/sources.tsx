import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Sources } from "../../../../src/solid/sources.js";
import { expose } from "../../shared/expose.js";
import { sources as initial, nextSources } from "../../shared/sources.js";

function Page(props: { motion?: MotionMode; refuse?: boolean }) {
  const openings: string[] = [];
  const [sources, setSources] = createSignal(initial);
  onSettled(() =>
    expose({
      kindHost: {
        add: () => setSources(nextSources.add),
        rename: () => setSources(nextSources.rename),
        openings,
      },
    }),
  );
  return (
    <div class="w-[30rem] p-6">
      <Sources
        id="sources"
        sources={sources()}
        motion={props.motion}
        {...(props.refuse
          ? {
              open: false,
              onOpenChange: (_open: boolean, details: { reason: string }) => openings.push(details.reason),
            }
          : {})}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refused: () => <Page refuse />,
};
