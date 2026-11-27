import { onSettled } from "solid-js";
import { ModelControl } from "../../../../src/solid/model-control.js";
import { expose } from "../../shared/expose.js";
import { controlHost, levels, modelActions, models, settings } from "../../shared/model-control.js";
import { costModels } from "../../shared/model-selector.js";

const { host, record } = controlHost();

function Page(props: { refusing?: boolean }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="p-6">
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
          if (props.refusing) details.cancel();
        }}
        onEffortChange={(value, details) => {
          record("effort")(value, details);
          if (props.refusing) details.cancel();
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
    <div class="p-6">
      <ModelControl id="control" models={costModels} defaultModel="claude-sonnet-5.5" defaultOpen />
    </div>
  ),
  all: () => <Page />,
  refusing: () => <Page refusing />,
};
