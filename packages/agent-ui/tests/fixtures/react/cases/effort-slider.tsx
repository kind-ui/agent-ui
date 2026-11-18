import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { EffortSlider } from "../../../../src/react/effort-slider.js";
import { effortHost, levels } from "../../shared/effort-slider.js";

const { host, record } = effortHost();

function Page({
  motion,
  refusing,
  controlled,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  controlled?: boolean;
}) {
  const [effort, setEffort] = useState("medium");
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <button id="set-low" type="button" onClick={() => setEffort("low")}>
        Set Low
      </button>
      <div className="flex items-center gap-2">
        <EffortSlider
          id="effort"
          levels={levels}
          {...(controlled ? { value: effort } : { defaultValue: "medium" })}
          onValueChange={(value, details) => {
            record("value")(value, details);
            if (refusing) details.cancel();
            else setEffort(value);
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
  none: () => <Page motion="none" />,
  refusing: () => <Page refusing />,
  controlled: () => <Page controlled />,
};
