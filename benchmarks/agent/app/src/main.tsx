import { createRoot } from "react-dom/client";
import { Screen, type ScreenState } from "./screen";
import "./styles.css";

type Tool = { name: string; description?: string; inputSchema: unknown };

const params = new URLSearchParams(location.search);
const tools = params.get("tools");
let state: ScreenState | undefined;
const benchmark: {
  state: () => ScreenState | undefined;
  tools?: Tool[];
  call?: (name: string, input: unknown) => Promise<unknown>;
} = { state: () => state };
Object.assign(window, { __benchmark: benchmark });

// Created before any component, so the bridge hears every one as it's made. The person who gave
// the task approves every step, as a host's `allow` would after asking them.
if (tools === "agent" || tools === "webmcp") {
  const { agentTools, createAgent, registerTools } = await import("@ui-sdk/react/agent");
  const agent = createAgent({ allow: () => true });
  if (tools === "agent") {
    benchmark.tools = agentTools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
    benchmark.call = (name, input) => agent[name as "snapshot" | "query" | "act"](input as never);
  } else {
    // The page writes no tools of its own: UI SDK registers them through WebMCP, and AI SDK's
    // MCP client reads them back from `document.modelContext`, as a browser's agent would.
    registerTools(agent, { allow: () => true });
    const { createMCPClient, Experimental_WebMCPTransport } = await import("@ai-sdk/mcp");
    const client = await createMCPClient({
      transport: new Experimental_WebMCPTransport({ modelContext: document.modelContext as never }),
    });
    const listed = await client.listTools();
    benchmark.tools = listed.tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    }));
    benchmark.call = async (name, input) => {
      const result = await client.callTool({ name, arguments: input as Record<string, unknown> });
      const text = (result.content as { type: string; text?: string }[] | undefined)
        ?.map((part) => part.text ?? "")
        .join("\n");
      return text ?? result;
    };
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("no #root");
createRoot(root).render(
  <Screen
    onState={(next) => {
      state = next;
    }}
  />,
);
requestAnimationFrame(() => {
  document.body.dataset.mounted = "";
});
