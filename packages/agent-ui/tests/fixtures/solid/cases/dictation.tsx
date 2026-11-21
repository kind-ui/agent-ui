import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onSettled } from "solid-js";
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

export const cases = {
  default: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  none: () => <Page motion="none" />,
  "no-source": () => <Page withSource={false} />,
};
