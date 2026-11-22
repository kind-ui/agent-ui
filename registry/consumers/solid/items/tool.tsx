import { Tool } from "../components/ui/solid/tool.js";

export default function ToolItem() {
  return (
    <Tool
      call={{
        toolCallId: "t1",
        name: "search_docs",
        dynamic: false,
        input: { state: "ready", value: { query: "steps" } },
        output: { state: "available", value: 0 },
      }}
      defaultOpen
    />
  );
}
