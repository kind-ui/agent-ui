import type {
  Experimental_WebMCPModelContext as WebMCPModelContext,
  Experimental_WebMCPTool as WebMCPTool,
} from "@ai-sdk/mcp";

type Registered = Omit<WebMCPTool, "origin" | "window"> & {
  execute: (input: object, context: { signal?: AbortSignal }) => unknown;
};

type ModelContext = WebMCPModelContext & {
  registerTool(tool: Registered, options?: { signal?: AbortSignal }): Promise<void>;
};

const page = () => document as Document & { modelContext?: Partial<ModelContext> };

// The page's half of WebMCP (`registerTool`) and the agent's half (`getTools`, `executeTool`) in one object, for a
// browser that doesn't ship `document.modelContext` yet.
function createModelContext(): ModelContext {
  const tools = new Map<string, Registered>();
  return {
    async registerTool(tool, options) {
      tools.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
    },
    async getTools() {
      return [...tools.values()].map(({ execute, ...tool }) => ({
        ...tool,
        origin: location.origin,
        window,
      }));
    },
    async executeTool(tool, input = {}, options) {
      const registered = tools.get(tool.name);
      if (!registered) throw new DOMException(`No tool named ${tool.name}`, "NotFoundError");
      try {
        return JSON.stringify(await registered.execute(input, { signal: options?.signal }));
      } catch (error) {
        throw new DOMException(error instanceof Error ? error.message : String(error), "OperationError");
      }
    },
  };
}

/**
 * The browser's model context when it can list and run tools, else one installed on `document` until `uninstall`.
 * `undefined` when the browser's model context only takes registrations.
 */
export function pageModelContext(): { context: WebMCPModelContext; uninstall: () => void } | undefined {
  const native = page().modelContext;
  if (native) {
    return native.getTools && native.executeTool
      ? { context: native as WebMCPModelContext, uninstall: () => {} }
      : undefined;
  }
  const context = createModelContext();
  page().modelContext = context;
  return {
    context,
    uninstall: () => {
      if (page().modelContext === context) delete page().modelContext;
    },
  };
}
