import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/react/composer.js";
import { Dictation } from "../../../../src/react/dictation.js";
import { dictationHost } from "../../shared/dictation.js";

const { host, source, record } = dictationHost();

const useHost = () =>
  useEffect(() => {
    Object.assign(window, { kindDictation: host });
  }, []);

function Page({ motion, withSource = true }: { motion?: MotionMode; withSource?: boolean }) {
  useHost();
  return (
    <div className="p-6" style={{ width: 320 }}>
      <Dictation {...(withSource ? { source } : {})} onText={record} motion={motion} />
    </div>
  );
}

// Without `onText` the Dictation hands its text to the composer; with `takeOver` the host cancels that.
function InComposer({ takeOver = false }: { takeOver?: boolean }) {
  useHost();
  return (
    <div className="p-4" style={{ width: 480 }}>
      <Composer aria-label="Message" onSubmit={() => undefined}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <Dictation
          source={source}
          {...(takeOver
            ? {
                onText: (text, details) => {
                  details.cancel();
                  record(text, details);
                },
              }
            : {})}
        />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}

export const cases = {
  default: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  none: () => <Page motion="none" />,
  "no-source": () => <Page withSource={false} />,
  composer: () => <InComposer />,
  "composer-cancel": () => <InComposer takeOver />,
};
