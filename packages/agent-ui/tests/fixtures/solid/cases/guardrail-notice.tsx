import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled, Show } from "solid-js";
import { GuardrailNotice } from "../../../../src/solid/guardrail-notice.js";
import { expose } from "../../shared/expose.js";
import { guardrails, noticeHost } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

function Page(props: { motion?: MotionMode }) {
  const [shown, setShown] = createSignal({ blocking: true, filtered: true, late: false });
  onSettled(() =>
    expose({
      kindHost: Object.assign(host, { add: () => setShown((current) => ({ ...current, late: true })) }),
    }),
  );
  const dismiss = (id: "blocking" | "filtered" | "late") => async () => {
    await dismissed(id);
    setShown((current) => ({ ...current, [id]: false }));
  };
  return (
    <div class="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      <Show when={shown().blocking}>
        <GuardrailNotice
          id="guardrail-blocking"
          {...guardrails.blocking}
          blocking
          motion={props.motion}
          onDismiss={dismiss("blocking")}
        />
      </Show>
      <Show when={shown().filtered}>
        <GuardrailNotice
          id="guardrail-filtered"
          variant="info"
          {...guardrails.filtered}
          motion={props.motion}
        />
      </Show>
      <Show when={shown().late}>
        <GuardrailNotice
          id="guardrail-late"
          label="Request blocked"
          reason="The prompt asked for malware."
          blocking
        />
      </Show>
      <button id="below" type="button">
        Below
      </button>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
};
