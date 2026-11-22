import type { SettingsValues } from "@kind-ui/agent-ui";
import { type CSSProperties, useState } from "react";
import { AddMenu } from "../../../../src/react/add-menu.js";
import { ApprovalMode } from "../../../../src/react/approval-mode.js";
import { Composer, ComposerInput, ComposerRestored, ComposerSubmit } from "../../../../src/react/composer.js";
import { ContextBar } from "../../../../src/react/context-bar.js";
import { Dictation } from "../../../../src/react/dictation.js";
import { ModelControl } from "../../../../src/react/model-control.js";
import { SettingsMenu } from "../../../../src/react/settings-menu.js";
import { addItems } from "../../shared/add-menu.js";
import { initialValue, modes } from "../../shared/approval-mode.js";
import { draftOptions } from "../../shared/composer.js";
import { contextChips } from "../../shared/context-bar.js";
import { dictationHost } from "../../shared/dictation.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";
import { initialValues, settings } from "../../shared/settings-menu.js";

const { source } = dictationHost();

function Page({ drafts }: { drafts: ReturnType<typeof draftOptions> }) {
  const [chips, setChips] = useState(contextChips(4));
  const [mode, setMode] = useState(initialValue);
  const [values, setValues] = useState<SettingsValues>(initialValues);
  return (
    <div className="p-4">
      <Composer aria-label="Message" onSubmit={() => undefined} {...drafts}>
        <ContextBar
          chips={chips}
          style={{ "--kind-context-chip-max-width": "120px" } as CSSProperties}
          onRemove={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        />
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <div style={controls}>
          <AddMenu items={addItems} onAction={() => undefined} />
          <ModelControl models={models} levels={levels} defaultModel="opus" defaultEffort="high" />
          <ApprovalMode modes={modes} value={mode} onValueChange={setMode} />
          <SettingsMenu settings={settings} values={values} onValuesChange={setValues} />
        </div>
        <ComposerRestored />
        <Dictation source={source} />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}

export const cases = {
  all: (params: URLSearchParams) => <Page drafts={draftOptions(params)} />,
};
