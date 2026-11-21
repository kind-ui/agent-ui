import { Terminal } from "../components/ui/solid/terminal.js";

export default function TerminalItem() {
  return <Terminal command="npm test" output={"\x1b[32m✓\x1b[0m 22 passed"} exitCode={0} defaultOpen />;
}
