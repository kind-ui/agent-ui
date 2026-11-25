// A stand-in for a model, so the live path (libfx in WebAssembly, tools, approvals, steering) can be tested without
// a key. libfx talks to it as a custom OpenAI Chat Completions provider. Development only.
//   npm run mock                                   # listens on 6002
//   FX_MOCK_URL=http://localhost:6002/v1 npm run dev
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 6002);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let calls = 0;

function chunk(delta, finish = null) {
  return `data: ${JSON.stringify({
    id: "mock",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "mock-model",
    choices: [{ index: 0, delta, finish_reason: finish }],
  })}\n\n`;
}

const text = (message) =>
  typeof message.content === "string"
    ? message.content
    : (message.content ?? []).map((part) => part.text ?? "").join("");

createServer(async (request, response) => {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-headers", "*");
  response.setHeader("access-control-allow-methods", "POST, GET, OPTIONS");
  if (request.method === "OPTIONS") return response.writeHead(204).end();
  if (request.method !== "POST" || !request.url.endsWith("/chat/completions"))
    return response.writeHead(404).end();
  let body = "";
  for await (const part of request) body += part;
  const { messages = [] } = JSON.parse(body);
  const last = messages.at(-1);
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const sawTool = messages.some((message) => message.role === "tool");
  console.log(`request: ${messages.length} messages, last ${last?.role}: ${text(last ?? {}).slice(0, 60)}`);

  response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
  response.write(chunk({ role: "assistant", content: "" }));
  if (!sawTool) {
    const args = JSON.stringify({ path: "notes.md", content: `# Notes\n\n${text(lastUser ?? {})}\n` });
    response.write(chunk({ content: "I'll write that down in notes.md." }));
    response.write(
      chunk({
        tool_calls: [
          {
            index: 0,
            id: `call_${++calls}`,
            type: "function",
            function: { name: "write_file", arguments: "" },
          },
        ],
      }),
    );
    for (let i = 0; i < args.length; i += 16) {
      response.write(chunk({ tool_calls: [{ index: 0, function: { arguments: args.slice(i, i + 16) } }] }));
      await sleep(20);
    }
    response.write(chunk({}, "tool_calls"));
  } else {
    const reply =
      last?.role === "user" && !text(last).includes("slowly")
        ? `Steer received: "${text(last)}". Changing course.`
        : "The tool finished. Here is a long reply streaming slowly so a person can steer it mid-sentence: one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.";
    for (const word of reply.split(/(?<= )/)) {
      if (response.destroyed) return;
      response.write(chunk({ content: word }));
      await sleep(120);
    }
    response.write(chunk({}, "stop"));
  }
  response.end("data: [DONE]\n\n");
}).listen(port, () => console.log(`mock model on http://localhost:${port}/v1`));
