import { convertToModelMessages, streamText, type UIMessage } from "ai";

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const result = streamText({
    model: "openai/gpt-5-mini",
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
