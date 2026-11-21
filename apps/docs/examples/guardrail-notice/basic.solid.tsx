import { createSignal, Show } from "solid-js";
import { GuardrailNotice } from "@/components/ui/solid/guardrail-notice";

export default function GuardrailNoticeExample() {
  const [shown, setShown] = createSignal(true);

  return (
    <div class="flex w-full max-w-xl flex-col gap-3">
      <Show
        when={shown()}
        fallback={
          <button
            type="button"
            class="self-start rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
            onClick={() => setShown(true)}
          >
            Show the notice again
          </button>
        }
      >
        <GuardrailNotice
          blocking
          label="Model output withheld"
          reason="The response included personal data."
          detail="Your organization's policy blocks responses that contain email addresses or phone numbers."
          onDismiss={() => setShown(false)}
        />
      </Show>
      <GuardrailNotice
        variant="info"
        label="Some results hidden"
        reason="Two search results matched a content filter."
        detail="Filtered results come from sites your organization has blocked."
      />
    </div>
  );
}
