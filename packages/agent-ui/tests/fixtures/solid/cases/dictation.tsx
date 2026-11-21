import type { MotionMode } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { onSettled } from "solid-js";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/solid/composer.js";
import { Dictation } from "../../../../src/solid/dictation.js";
import { dictationHost } from "../../shared/dictation.js";
import { expose } from "../../shared/expose.js";

const { host, source, record } = dictationHost();

function Page(props: { motion?: MotionMode; withSource?: boolean }) {
  onSettled(() => expose({ kindDictation: host }));
  return (
    <div class="p-6" style={{ width: "320px" }}>
      <Dictation {...(props.withSource === false ? {} : { source })} onText={record} motion={props.motion} />
    </div>
  );
}

type OnText = NonNullable<ComponentProps<typeof Dictation>["onText"]>;

function InComposer(props: { takeOver?: boolean }) {
  onSettled(() => expose({ kindDictation: host }));
  return (
    <div class="p-4" style={{ width: "480px" }}>
      <Composer aria-label="Message">
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <Dictation
          source={source}
          {...(props.takeOver
            ? {
                onText: ((text, details) => {
                  details.cancel();
                  record(text, details);
                }) satisfies OnText,
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
