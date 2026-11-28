import { useEffect } from "react";
import { ModelControl } from "../../../../src/react/model-control.js";
import { controlHost, levels, modelActions, models, settings } from "../../shared/model-control.js";
import { costModels } from "../../shared/model-selector.js";

const { host, record } = controlHost();

function Page({ refusing }: { refusing?: boolean }) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="p-6">
      <ModelControl
        id="control"
        models={models}
        levels={levels}
        settings={settings}
        defaultModel="opus"
        defaultEffort="medium"
        defaultValues={{ fast: false, context: "1m" }}
        onModelChange={(value, details) => {
          record("model")(value, details);
          if (refusing) details.cancel();
        }}
        onEffortChange={(value, details) => {
          record("effort")(value, details);
          if (refusing) details.cancel();
        }}
        onValuesChange={(values, details) => record(details.id)(values[details.id], details)}
        actions={modelActions}
        onAction={record("action")}
      />
    </div>
  );
}

export const cases = {
  cost: () => (
    <div className="p-6">
      <ModelControl id="control" models={costModels} defaultModel="claude-sonnet-5.5" />
    </div>
  ),
  all: () => <Page />,
  refusing: () => <Page refusing />,
};
