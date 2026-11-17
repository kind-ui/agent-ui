import type { MotionMode } from "@kind-ui/agent-ui/core";
import { type ReactElement, useEffect } from "react";
import { ModelSelector } from "../../../../src/react/model-selector.js";
import { ReasoningEffort } from "../../../../src/react/reasoning-effort.js";
import { iconModels, levels, models, selectionHost } from "../../shared/model-selector.js";

const { host, record } = selectionHost();

function Toolbar({ motion, refusing }: { motion?: MotionMode; refusing?: boolean }) {
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
          {...(refusing ? { value: "gpt-5" } : { defaultValue: "gpt-5" })}
          onValueChange={record("model")}
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
    props[name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())] = value;
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
    </div>
  );
}

export const cases = {
  all: () => <Toolbar />,
  logos: () => <Logos />,
  reduced: () => <Toolbar motion="reduced" />,
  refusing: () => <Toolbar refusing />,
};
