import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { ModelSelector } from "../../../../src/react/model-selector.js";
import { ReasoningEffort } from "../../../../src/react/reasoning-effort.js";
import { levels, models, selectionHost } from "../../shared/model-selector.js";

const { host, record } = selectionHost();

function Toolbar({ motion }: { motion?: MotionMode }) {
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
          defaultValue="gpt-5"
          onValueChange={record("model")}
          motion={motion}
        />
        <ReasoningEffort
          id="effort"
          levels={levels}
          defaultValue="medium"
          onValueChange={record("effort")}
          motion={motion}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = { all: () => <Toolbar />, reduced: () => <Toolbar motion="reduced" /> };
