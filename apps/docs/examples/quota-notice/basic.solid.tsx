import { createSignal, Show } from "solid-js";
import { QuotaNotice } from "@/components/ui/solid/quota-notice";

export default function QuotaNoticeExample() {
  const [used, setUsed] = createSignal(800);
  const [shown, setShown] = createSignal(true);

  return (
    <div class="flex w-full max-w-xl flex-col items-start gap-3">
      <Show when={shown()}>
        <QuotaNotice
          class="w-full"
          used={used()}
          limit={1000}
          period="this month"
          now="2026-11-28T09:00:00Z"
          resetAt="2026-12-01T09:00:00Z"
          onUpgrade={() => window.alert("Upgrade")}
          onDismiss={() => setShown(false)}
        />
      </Show>
      <button
        type="button"
        class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm"
        onClick={() => {
          setShown(true);
          setUsed((current) => (current >= 1000 ? 800 : current + 100));
        }}
      >
        {used() >= 1000 ? "Start over" : "Send 100 requests"}
      </button>
    </div>
  );
}
