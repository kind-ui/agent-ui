import { dayKey } from "@kind-ui/agent-ui/core";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { DaySeparator } from "@/components/ui/day-separator";

const timeZone = "America/Los_Angeles";

const messages = [
  {
    id: "m1",
    role: "user",
    createdAt: "2026-11-16T17:40:00Z",
    text: "Can you check why the nightly export failed?",
  },
  {
    id: "m2",
    role: "assistant",
    createdAt: "2026-11-16T17:41:00Z",
    text: "Every run since Wednesday stopped after 30 seconds waiting on the reports service.",
  },
  { id: "m3", role: "user", createdAt: "2026-11-17T16:05:00Z", text: "Did last night's run go through?" },
  {
    id: "m4",
    role: "assistant",
    createdAt: "2026-11-17T16:06:00Z",
    text: "Yes. It retried two pages and finished in 48 minutes.",
  },
];

type Row = { id: string; date: string } | { id: string; message: (typeof messages)[number] };

const rows = messages.flatMap((message, index): Row[] => {
  const day = dayKey(message.createdAt, timeZone);
  const previous = messages[index - 1];
  const newDay = !previous || dayKey(previous.createdAt, timeZone) !== day;
  return newDay
    ? [
        { id: `day-${day}`, date: message.createdAt },
        { id: message.id, message },
      ]
    : [{ id: message.id, message }];
});

export default function DaySeparatorExample() {
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={rows.length}
      className="h-80 w-full max-w-xl rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          {rows.map((row, index) => (
            <ConversationRow key={row.id} value={row.id} index={index}>
              {"message" in row ? (
                <p
                  className={
                    row.message.role === "user"
                      ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                      : undefined
                  }
                >
                  {row.message.text}
                </p>
              ) : (
                <DaySeparator date={row.date} timeZone={timeZone} />
              )}
            </ConversationRow>
          ))}
        </ConversationContent>
      </ConversationViewport>
    </Conversation>
  );
}
