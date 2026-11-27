import type { MotionMode } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import { onSettled } from "solid-js";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/solid/composer.js";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorTrigger,
} from "../../../../src/solid/model-selector.js";
import { ReasoningEffort } from "../../../../src/solid/reasoning-effort.js";
import { expose } from "../../shared/expose.js";
import {
  costModels,
  iconModels,
  levels,
  modelActions,
  models,
  selectionHost,
} from "../../shared/model-selector.js";

const { host, record } = selectionHost();

function Toolbar(props: { motion?: MotionMode; refusing?: boolean; plain?: boolean; pages?: "groups" }) {
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div id="toolbar" class="flex items-center gap-2">
        <ModelSelector
          id="model"
          models={models}
          pages={props.pages}
          {...(props.refusing ? { value: "gpt-5" } : { defaultValue: "gpt-5" })}
          onValueChange={(value, details) => {
            record("model")(value, details);
            if (props.refusing) details.cancel();
          }}
          {...(props.plain
            ? {}
            : {
                actions: modelActions,
                onAction: (id: string, details: { reason: string; cancel(): void }) => {
                  record("action")(id, details);
                  if (props.refusing) details.cancel();
                },
              })}
          motion={props.motion}
        />
        <ReasoningEffort
          id="effort"
          levels={levels}
          {...(props.refusing ? { value: "medium" } : { defaultValue: "medium" })}
          onValueChange={record("effort")}
          motion={props.motion}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

/**
 * A logo's markup as a function that draws an `svg` element, its attributes as they are and its contents as its inner
 * HTML: a Solid element is one DOM node, so each place the icon shows calls it for its own.
 */
const logo = (markup: string): (() => JSX.Element) => {
  const [, attributes = "", contents = ""] = /^<svg([^>]*)>(.*)<\/svg>$/s.exec(markup) ?? [];
  const props: Record<string, string> = {};
  for (const [, name = "", value = ""] of attributes.matchAll(/([\w:-]+)="([^"]*)"/g)) props[name] = value;
  return () => <svg {...props} innerHTML={contents} />;
};

function Logos() {
  const logoModels = iconModels(logo);
  onSettled(() => expose({ kindHost: host }));
  return (
    <div class="flex flex-col gap-4 p-6">
      <ModelSelector
        id="model"
        models={logoModels}
        defaultValue="claude-sonnet-5.5"
        onValueChange={record("model")}
      />
      <div class="ps-32">
        <ModelSelector
          id="second"
          models={logoModels}
          defaultValue="mai-code-2"
          onValueChange={record("second")}
        />
      </div>
      <div class="ps-64">
        <ModelSelector id="third" models={logoModels} defaultValue="gpt-6-astra">
          <ModelSelectorTrigger id="mine" />
          <ModelSelectorContent />
        </ModelSelector>
      </div>
    </div>
  );
}

// `shared/full-composer.ts`'s `controls`, in the kebab-case keys a Solid `style` takes.
const controls = {
  "grid-area": "attach",
  display: "flex",
  "flex-wrap": "wrap",
  "align-items": "center",
  gap: "6px",
  "min-width": "0",
};

function InComposer() {
  const logoModels = iconModels(logo);
  return (
    <div class="p-4">
      <Composer aria-label="Message" onSubmit={() => undefined}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <div style={controls}>
          <ModelSelector id="model" models={logoModels} defaultValue="claude-sonnet-5.5" />
          <ReasoningEffort id="effort" levels={levels} defaultValue="medium" />
        </div>
        <ComposerSubmit />
      </Composer>
    </div>
  );
}

export const cases = {
  cost: () => (
    <div class="p-6">
      <ModelSelector id="model" models={costModels} defaultValue="claude-sonnet-5.5" defaultOpen />
    </div>
  ),
  all: () => <Toolbar />,
  plain: () => <Toolbar plain />,
  groups: () => <Toolbar pages="groups" />,
  logos: () => <Logos />,
  composer: () => <InComposer />,
  reduced: () => <Toolbar motion="reduced" />,
  refusing: () => <Toolbar refusing />,
};
