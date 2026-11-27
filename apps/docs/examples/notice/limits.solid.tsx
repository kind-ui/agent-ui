import { createSignal, onSettled, Show } from "solid-js";
import { Notice } from "@/components/ui/solid/notice";

const HOUR = 3_600_000;

export default function NoticeLimitsExample() {
  // Resets are relative to now, which only the browser knows, so the server renders the notices without them.
  const [now, setNow] = createSignal<number>();
  onSettled(() => {
    setNow(Date.now());
  });
  const at = (hours: number) => {
    const start = now();
    return start === undefined ? undefined : new Date(start + hours * HOUR).toISOString();
  };
  const [warned, setWarned] = createSignal(true);

  return (
    <div class="flex w-full max-w-xl flex-col gap-3">
      <Show
        when={warned()}
        fallback={
          <button
            type="button"
            data-kind-button="secondary"
            class="self-start"
            onClick={() => setWarned(true)}
          >
            Show the warning again
          </button>
        }
      >
        <Notice
          variant="warning"
          label="12 requests left"
          resetsAt={at(76)}
          onDismiss={() => setWarned(false)}
          actions={
            <button type="button" data-kind-button="secondary">
              Upgrade
            </button>
          }
        >
          You've used most of this week's requests.
        </Notice>
      </Show>
      <Notice
        variant="error"
        label="You've reached your weekly limit"
        resetsAt={at(0.7)}
        actions={
          <>
            <button type="button" data-kind-button="secondary">
              Continue at reset
            </button>
            <button type="button" data-kind-button="secondary">
              Switch to Claude Sonnet 5.5
            </button>
            <button type="button" data-kind-button="primary">
              Use credits
            </button>
          </>
        }
      >
        New runs pause until then.
      </Notice>
    </div>
  );
}
