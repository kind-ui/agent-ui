import type { SettingsValues } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/solid/composer";
import { SettingsMenu, type SettingsMenuSetting } from "@/components/ui/solid/settings-menu";

const settings: SettingsMenuSetting[] = [
  {
    type: "toggle",
    id: "search",
    label: "Web search",
    description: "Look things up before answering",
  },
  { type: "toggle", id: "memory", label: "Memory" },
  {
    type: "choice",
    id: "style",
    label: "Response style",
    options: [
      { value: "concise", label: "Concise" },
      { value: "balanced", label: "Balanced" },
      { value: "detailed", label: "Detailed" },
    ],
  },
];

export default function SettingsMenuExample() {
  const [values, setValues] = createSignal<SettingsValues>({
    search: true,
    memory: false,
    style: "balanced",
  });

  return (
    <Composer aria-label="Message" onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1000))}>
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <SettingsMenu
        style={{ "grid-area": "attach" }}
        settings={settings}
        values={values()}
        onValuesChange={(next) => setValues(next)}
      />
      <ComposerSubmit />
    </Composer>
  );
}
