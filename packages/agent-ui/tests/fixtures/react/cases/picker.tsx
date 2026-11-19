import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { Picker } from "../../../../src/react/picker.js";
import { pickerHost, placeActions, places } from "../../shared/picker.js";

const { host, record } = pickerHost();

function Page({
  motion,
  refusing,
  presentation,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  presentation?: "sheet";
}) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <Picker
          id="picker"
          label="Work in"
          items={places}
          actions={placeActions}
          {...(refusing ? { value: "kind-ui/agent-ui" } : { defaultValue: "kind-ui/agent-ui" })}
          onValueChange={(value, details) => {
            record("value")(value, details);
            if (refusing) details.cancel();
          }}
          onAction={(id, details) => {
            record("action")(id, details);
            if (refusing) details.cancel();
          }}
          motion={motion}
          presentation={presentation}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

/** A picker whose items have no icons and nothing chosen. */
function Plain() {
  return (
    <div className="p-6">
      <Picker
        id="picker"
        label="Branch"
        items={[
          { value: "main", label: "main" },
          { value: "dev", label: "dev" },
        ]}
      />
    </div>
  );
}

export const cases = {
  plain: () => <Plain />,
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
  sheet: () => <Page presentation="sheet" />,
};
