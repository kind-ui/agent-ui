import { h } from "vue";
import { Terminal } from "../components/ui/vue/terminal.js";

export default () =>
  h(Terminal, { command: "npm test", output: "\x1b[32m✓\x1b[0m 22 passed", exitCode: 0, defaultOpen: true });
