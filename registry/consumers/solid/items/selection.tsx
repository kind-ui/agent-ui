import { Selection } from "../components/ui/solid/selection.js";

export default function SelectionItem() {
  return (
    <Selection actions={[{ id: "ask", label: "Ask" }]} onAction={() => {}}>
      <p>Retry with backoff.</p>
    </Selection>
  );
}
