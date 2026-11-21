import { SettingsMenu } from "../components/ui/solid/settings-menu.js";

export default function SettingsMenuItem() {
  return (
    <SettingsMenu
      settings={[{ type: "toggle", id: "memory", label: "Memory" }]}
      defaultValues={{ memory: true }}
    />
  );
}
