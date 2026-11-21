import { createSignal } from "solid-js";
import { KindToolbar, KindToolbarButton } from "@/components/ui/solid/internal/toolbar";
import {
  Message,
  MessageContent,
  MessageCopy,
  MessageRegenerate,
  MessageToolbar,
} from "@/components/ui/solid/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

const regenerateOptions = [
  { id: "details", label: "Add details" },
  { id: "concise", label: "More concise", description: "Keep it to one sentence" },
  {
    id: "model",
    label: "Try with another model",
    items: [
      { id: "model-fast", label: "Fast model" },
      { id: "model-deep", label: "Deep model" },
    ],
  },
];

export default function MessageRegenerateOptionsExample() {
  const [chosen, setChosen] = createSignal("Nothing yet");

  return (
    <div class="flex w-full max-w-xl flex-col gap-3">
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        text={reply}
        regenerateOptions={regenerateOptions}
        onRegenerate={(_text, details) => setChosen(details.optionId ?? "Try again")}
      >
        <MessageContent>{reply}</MessageContent>
        <MessageToolbar>
          <KindToolbar aria-label="Message actions">
            <MessageCopy>
              <KindToolbarButton aria-label="Copy" />
            </MessageCopy>
            <MessageRegenerate>
              {(props) => <KindToolbarButton aria-label="Regenerate" {...props} />}
            </MessageRegenerate>
          </KindToolbar>
        </MessageToolbar>
      </Message>
      <p class="text-sm text-[var(--kind-color-muted)]">Last regenerated with: {chosen()}</p>
    </div>
  );
}
