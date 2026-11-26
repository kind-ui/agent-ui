import { Trace } from "../components/ui/solid/trace.js";

export default function TraceItem() {
  return (
    <Trace
      label="Agent run"
      spans={[
        { id: "run", name: "Answer the question", kind: "agent", status: "complete", start: 0, end: 1200 },
      ]}
    />
  );
}
