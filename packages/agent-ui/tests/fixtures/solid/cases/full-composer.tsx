import type { SettingsValues } from "@kind-ui/agent-ui";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";
import { AddMenu } from "../../../../src/solid/add-menu.js";
import { ApprovalMode } from "../../../../src/solid/approval-mode.js";
import { Composer, ComposerInput, ComposerRestored, ComposerSubmit } from "../../../../src/solid/composer.js";
import { ContextBar } from "../../../../src/solid/context-bar.js";
import { Dictation } from "../../../../src/solid/dictation.js";
import { ModelControl } from "../../../../src/solid/model-control.js";
import { SettingsMenu } from "../../../../src/solid/settings-menu.js";
import { addItems } from "../../shared/add-menu.js";
import { initialValue, modes } from "../../shared/approval-mode.js";
import { draftOptions } from "../../shared/composer.js";
import { contextChips } from "../../shared/context-bar.js";
import { dictationHost } from "../../shared/dictation.js";
import { levels, models } from "../../shared/model-control.js";
import { initialValues, settings } from "../../shared/settings-menu.js";

const { source } = dictationHost();

// `shared/full-composer.ts`'s `controls`, in the kebab-case keys a Solid `style` takes.
const controls = {
  "grid-area": "attach",
  display: "flex",
  "flex-wrap": "wrap",
  "align-items": "center",
  gap: "6px",
  "min-width": "0",
};

function Page(props: { drafts: ReturnType<typeof draftOptions> }) {
  const [chips, setChips] = createSignal(contextChips(4));
  const [mode, setMode] = createSignal(initialValue);
  const [values, setValues] = createSignal<SettingsValues>(initialValues);
  return (
    <div class="p-4">
      <Composer aria-label="Message" onSubmit={() => undefined} {...props.drafts}>
        <ContextBar
          chips={chips()}
          style={{ "--kind-context-chip-max-width": "120px" } as JSX.CSSProperties}
          onRemove={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        />
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <div style={controls}>
          <AddMenu items={addItems} onAction={() => undefined} />
          <ModelControl models={models} levels={levels} defaultModel="opus" defaultEffort="high" />
          <ApprovalMode modes={modes} value={mode()} onValueChange={(value) => setMode(value)} />
          <SettingsMenu settings={settings} values={values()} onValuesChange={(next) => setValues(next)} />
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
