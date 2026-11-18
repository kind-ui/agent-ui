import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { Dictation } from "../../../../src/react/dictation.js";
import { dictationHost } from "../../shared/dictation.js";

const { host, source, record } = dictationHost();

function Page({ motion, withSource = true }: { motion?: MotionMode; withSource?: boolean }) {
  useEffect(() => {
    Object.assign(window, { kindDictation: host });
  }, []);
  return (
    <div className="p-6" style={{ width: 320 }}>
      <Dictation {...(withSource ? { source } : {})} onText={record} motion={motion} />
    </div>
  );
}

export const cases = {
  default: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  none: () => <Page motion="none" />,
  "no-source": () => <Page withSource={false} />,
};
