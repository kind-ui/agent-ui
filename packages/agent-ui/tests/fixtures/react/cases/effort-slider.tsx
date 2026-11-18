import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { EffortSlider } from "../../../../src/react/effort-slider.js";
import { effortHost, levels } from "../../shared/effort-slider.js";

const { host, record } = effortHost();

function Page({ motion, refusing }: { motion?: MotionMode; refusing?: boolean }) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <EffortSlider
          id="effort"
          levels={levels}
          {...(refusing ? { value: "medium" } : { defaultValue: "medium" })}
          onValueChange={(value, details) => {
            record("value")(value, details);
            if (refusing) details.cancel();
          }}
          modelLabel="GPT-5"
          onModelPress={(model, details) => record("model")(model, details)}
          motion={motion}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
};
