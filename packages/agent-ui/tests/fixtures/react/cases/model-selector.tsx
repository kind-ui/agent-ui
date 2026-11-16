import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { ModelSelector } from "../../../../src/react/model-selector.js";
import { ReasoningEffort } from "../../../../src/react/reasoning-effort.js";
import { levels, models, selectionHost } from "../../shared/model-selector.js";

const { host, record } = selectionHost();

function Toolbar({ motion, refusing }: { motion?: MotionMode; refusing?: boolean }) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div id="toolbar" className="flex items-center gap-2">
        <ModelSelector
          id="model"
          models={models}
          {...(refusing ? { value: "gpt-5" } : { defaultValue: "gpt-5" })}
          onValueChange={record("model")}
          motion={motion}
        />
        <ReasoningEffort
          id="effort"
          levels={levels}
          {...(refusing ? { value: "medium" } : { defaultValue: "medium" })}
          onValueChange={record("effort")}
          motion={motion}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Toolbar />,
  reduced: () => <Toolbar motion="reduced" />,
  refusing: () => <Toolbar refusing />,
};
