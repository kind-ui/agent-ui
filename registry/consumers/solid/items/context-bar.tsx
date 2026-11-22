import { ContextBar } from "../components/ui/solid/context-bar.js";

export default function ContextBarItem() {
  return <ContextBar chips={[{ id: "readme", label: "README.md" }]} />;
}
