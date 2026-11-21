import type { MessageStatus } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/solid/message";

const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

export default function MessageOutcomesExample() {
  const [stopped, setStopped] = createSignal<{ status: MessageStatus; text: string }>({
    status: "aborted",
    text: "Start with the slowest query: it scans the whole orders table",
  });
  const [failed, setFailed] = createSignal<{ status: MessageStatus; text: string }>({
    status: "error",
    text: "",
  });

  return (
    <div class="flex w-full max-w-xl flex-col gap-6">
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        status={stopped().status}
        text={stopped().text}
        onContinue={async () => {
          await wait();
          setStopped({
            status: "complete",
            text: `${stopped().text}, so an index on customer_id brings it under 10 ms.`,
          });
        }}
      >
        <MessageContent>{stopped().text}</MessageContent>
        <MessageOutcome />
      </Message>
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        status={failed().status}
        text={failed().text}
        error="The model is overloaded. Try again in a moment."
        onRetry={async () => {
          await wait();
          setFailed({ status: "complete", text: "Add the index, then run the query again to compare." });
        }}
      >
        <MessageContent>{failed().text}</MessageContent>
        <MessageOutcome />
      </Message>
    </div>
  );
}
