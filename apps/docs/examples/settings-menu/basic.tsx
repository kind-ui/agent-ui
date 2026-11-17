"use client";
import type { SettingsValues } from "@kind-ui/agent-ui";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { SettingsMenu, type SettingsMenuSetting } from "@/components/ui/settings-menu";

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
  const [values, setValues] = useState<SettingsValues>({ search: true, memory: false, style: "balanced" });

  return (
    <Composer aria-label="Message" onSubmit={() => new Promise<void>((resolve) => setTimeout(resolve, 1000))}>
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <SettingsMenu style={{ gridArea: "attach" }} settings={settings} values={values} onValuesChange={setValues} />
      <ComposerSubmit />
    </Composer>
  );
}
