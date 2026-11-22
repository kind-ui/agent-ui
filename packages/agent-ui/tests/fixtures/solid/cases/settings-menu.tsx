import type { SettingsValues } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { SettingsMenu } from "../../../../src/solid/settings-menu.js";
import { expose } from "../../shared/expose.js";
import { initialValues, settings, settingsMenuHost } from "../../shared/settings-menu.js";

const { host, change } = settingsMenuHost();

function Page(props: { motion?: MotionMode; refusing?: boolean }) {
  const [values, setValues] = createSignal<SettingsValues>(initialValues);
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="p-6">
      <SettingsMenu
        id="settings"
        settings={settings}
        values={values()}
        onValuesChange={(next, details) => {
          change(next, details);
          if (props.refusing) details.cancel();
          else setValues(next);
        }}
        motion={props.motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
};
