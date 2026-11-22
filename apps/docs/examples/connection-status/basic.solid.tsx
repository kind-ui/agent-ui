import { createSignal, For } from "solid-js";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/solid/composer";
import { ConnectionStatus } from "@/components/ui/solid/connection-status";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/solid/conversation";

type Connection = "online" | "reconnecting" | "offline";

const messages = [
  { id: "m1", role: "user", text: "Why did the deploy to staging stop halfway?" },
  {
    id: "m2",
    role: "assistant",
    text: "The migration step timed out waiting for a lock on the orders table. A long report query was holding it.",
  },
  { id: "m3", role: "user", text: "Can you rerun it once the query finishes?" },
];

const states: Connection[] = ["online", "reconnecting", "offline"];

const inFiveSeconds = () => new Date(Date.now() + 5000).toISOString();

export default function ConnectionStatusExample() {
  const [state, setState] = createSignal<Connection>("reconnecting");
  const [retryAt, setRetryAt] = createSignal(inFiveSeconds());

  const choose = (next: Connection) => {
    if (next === "reconnecting") setRetryAt(inFiveSeconds());
    setState(next);
  };
  const retry = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setState("online");
        resolve();
      }, 800);
    });

  return (
    <div class="flex w-full max-w-xl flex-col gap-3">
      <fieldset class="flex flex-wrap gap-1 self-start border-0 p-0 text-sm">
        <legend class="sr-only">Connection</legend>
        <For each={states}>
          {(option) => (
            <button
              type="button"
              aria-pressed={state() === option ? "true" : "false"}
              onClick={() => choose(option)}
              class="w-28 rounded-md border border-[var(--kind-color-border)] py-1 capitalize aria-pressed:bg-[var(--kind-color-hover)]"
            >
              {option}
            </button>
          )}
        </For>
      </fieldset>
      <Conversation
        aria-label="Conversation"
        messageCount={messages.length}
        class="h-56 rounded-xl border border-[var(--kind-color-border)]"
      >
        <ConversationViewport>
          <ConversationContent>
            <For each={messages} keyed={(message) => message.id}>
              {(message, index) => (
                <ConversationRow value={message().id} index={index()}>
                  <p
                    class={
                      message().role === "user"
                        ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                        : undefined
                    }
                  >
                    {message().text}
                  </p>
                </ConversationRow>
              )}
            </For>
          </ConversationContent>
        </ConversationViewport>
        <ConnectionStatus state={state()} retryAt={retryAt()} onRetry={retry} />
      </Conversation>
      <Composer aria-label="Message" disabled={state() === "offline"}>
        <ComposerInput aria-label="Prompt" placeholder={state() === "offline" ? "Offline" : "Ask anything"} />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}
