import type { MotionMode } from "@kind-ui/agent-ui/core";
import { onSettled } from "solid-js";
import { Picker } from "../../../../src/solid/picker.js";
import { expose } from "../../shared/expose.js";
import { pickerHost, placeActions, places } from "../../shared/picker.js";

const { host, record } = pickerHost();

function Page(props: { motion?: MotionMode; refusing?: boolean; presentation?: "sheet" }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div class="flex items-center gap-2">
        <Picker
          id="picker"
          label="Work in"
          items={places}
          actions={placeActions}
          {...(props.refusing ? { value: "kind-ui/agent-ui" } : { defaultValue: "kind-ui/agent-ui" })}
          onValueChange={(value, details) => {
            record("value")(value, details);
            if (props.refusing) details.cancel();
          }}
          onAction={(id, details) => {
            record("action")(id, details);
            if (props.refusing) details.cancel();
          }}
          motion={props.motion}
          presentation={props.presentation}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

/** A picker whose items have no icons and nothing chosen. */
function Plain() {
  return (
    <div class="p-6">
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
