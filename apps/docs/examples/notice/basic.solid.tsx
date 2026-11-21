import { createSignal, Show } from "solid-js";
import { Notice } from "@/components/ui/solid/notice";

export default function NoticeExample() {
  const [rateLimited, setRateLimited] = createSignal(true);

  return (
    <div class="flex w-full max-w-xl flex-col gap-3">
      <Notice label="Indexing your files">Answers may miss files added in the last minute.</Notice>
      <Notice variant="success" label="Connected to GitHub">
        The assistant can read your repositories now.
      </Notice>
      <Show
        when={rateLimited()}
        fallback={
          <button
            type="button"
            data-kind-button="secondary"
            class="self-start"
            onClick={() => setRateLimited(true)}
          >
            Show the warning again
          </button>
        }
      >
        <Notice variant="warning" label="Rate limited" onDismiss={() => setRateLimited(false)}>
          Responses are slower for the next few minutes.
        </Notice>
      </Show>
      <Notice
        variant="error"
        label="Couldn't reach the model"
        actions={
          <button type="button" data-kind-button="secondary">
            Retry
          </button>
        }
      >
        Check your connection and try again.
      </Notice>
    </div>
  );
}
