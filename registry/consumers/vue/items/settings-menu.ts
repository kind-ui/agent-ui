import { h } from "vue";
import { SettingsMenu } from "../components/ui/vue/settings-menu.js";

export default () =>
  h(SettingsMenu, {
    settings: [{ type: "toggle", id: "search", label: "Web search" }],
    defaultValues: { search: true },
  });
