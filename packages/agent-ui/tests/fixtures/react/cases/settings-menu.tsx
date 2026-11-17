import type { SettingsValues } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { SettingsMenu } from "../../../../src/react/settings-menu.js";
import { initialValues, settings, settingsMenuHost } from "../../shared/settings-menu.js";

const { host, change } = settingsMenuHost();

function Page({ motion, refusing }: { motion?: MotionMode; refusing?: boolean }) {
  const [values, setValues] = useState<SettingsValues>(initialValues);
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="p-6">
      <SettingsMenu
        id="settings"
        settings={settings}
        values={values}
        onValuesChange={(next, details) => {
          change(next, details);
          if (refusing) details.cancel();
          else setValues(next);
        }}
        motion={motion}
      />
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refusing: () => <Page refusing />,
};
