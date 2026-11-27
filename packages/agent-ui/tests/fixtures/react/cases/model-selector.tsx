import type { MotionMode } from "@kind-ui/agent-ui/core";
import { type ReactElement, useEffect } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/react/composer.js";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorTrigger,
} from "../../../../src/react/model-selector.js";
import { ReasoningEffort } from "../../../../src/react/reasoning-effort.js";
import { controls } from "../../shared/full-composer.js";
import {
  costModels,
  iconModels,
  levels,
  modelActions,
  models,
  selectionHost,
} from "../../shared/model-selector.js";

const { host, record } = selectionHost();

function Toolbar({
  motion,
  refusing,
  plain,
  pages,
}: {
  motion?: MotionMode;
  refusing?: boolean;
  plain?: boolean;
  pages?: "groups";
}) {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <p id="above">Above</p>
      <div id="toolbar" className="flex items-center gap-2">
        <ModelSelector
          id="model"
          models={models}
          pages={pages}
          {...(refusing ? { value: "gpt-5" } : { defaultValue: "gpt-5" })}
          onValueChange={(value, details) => {
            record("model")(value, details);
            if (refusing) details.cancel();
          }}
          {...(plain
            ? {}
            : {
                actions: modelActions,
                onAction: (id: string, details: { reason: string; cancel(): void }) => {
                  record("action")(id, details);
                  if (refusing) details.cancel();
                },
              })}
          motion={motion}
        />
        <ReasoningEffort
          id="effort"
          levels={levels}
          {...(refusing ? { value: "medium" } : { defaultValue: "medium" })}
          onValueChange={record("effort")}
          motion={motion}
        />
        <span id="beside">Beside</span>
      </div>
    </div>
  );
}

/** A logo's markup as an `svg` element, its attributes as props and its contents as they are. */
const logo = (markup: string): ReactElement => {
  const [, attributes = "", contents = ""] = /^<svg([^>]*)>(.*)<\/svg>$/s.exec(markup) ?? [];
  const props: Record<string, string> = {};
  for (const [, name = "", value = ""] of attributes.matchAll(/([\w:-]+)="([^"]*)"/g))
    props[
      /^(aria|data)-/.test(name) ? name : name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())
    ] = value;
  return <svg {...props} dangerouslySetInnerHTML={{ __html: contents }} />;
};

const logoModels = iconModels(logo);

function Logos() {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6">
      <ModelSelector
        id="model"
        models={logoModels}
        defaultValue="claude-sonnet-5.5"
        onValueChange={record("model")}
      />
      <div className="ps-32">
        <ModelSelector
          id="second"
          models={logoModels}
          defaultValue="mai-code-2"
          onValueChange={record("second")}
        />
      </div>
      <div className="ps-64">
        <ModelSelector id="third" models={logoModels} defaultValue="gpt-6-astra">
          <ModelSelectorTrigger id="mine" />
          <ModelSelectorContent />
        </ModelSelector>
      </div>
    </div>
  );
}

function InComposer() {
  return (
    <div className="p-4">
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

function Cost() {
  return (
    <div className="p-6">
      <ModelSelector id="model" models={costModels} defaultValue="claude-sonnet-5.5" defaultOpen />
    </div>
  );
}

export const cases = {
  cost: () => <Cost />,
  all: () => <Toolbar />,
  plain: () => <Toolbar plain />,
  groups: () => <Toolbar pages="groups" />,
  logos: () => <Logos />,
  composer: () => <InComposer />,
  reduced: () => <Toolbar motion="reduced" />,
  refusing: () => <Toolbar refusing />,
};
