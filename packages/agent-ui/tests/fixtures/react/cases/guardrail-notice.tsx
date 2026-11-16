import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { GuardrailNotice } from "../../../../src/react/guardrail-notice.js";
import { guardrails, noticeHost } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

function Page({ motion, refuse }: { motion?: MotionMode; refuse?: boolean }) {
  const [shown, setShown] = useState({ blocking: true, filtered: true, late: false });
  useEffect(() => {
    Object.assign(window, {
      kindHost: Object.assign(host, { add: () => setShown((current) => ({ ...current, late: true })) }),
    });
  }, []);
  const dismiss = (id: keyof typeof shown) => async () => {
    await dismissed(id);
    setShown((current) => ({ ...current, [id]: false }));
  };
  return (
    <div className="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      {shown.blocking ? (
        <GuardrailNotice
          id="guardrail-blocking"
          {...guardrails.blocking}
          blocking
          motion={motion}
          onDismiss={dismiss("blocking")}
          {...(refuse && {
            open: false,
            onOpenChange: (_open, details) => host.openings.push(details.reason),
          })}
        />
      ) : null}
      {shown.filtered ? (
        <GuardrailNotice id="guardrail-filtered" variant="info" {...guardrails.filtered} motion={motion} />
      ) : null}
      {shown.late ? (
        <GuardrailNotice
          id="guardrail-late"
          label="Request blocked"
          reason="The prompt asked for malware."
          blocking
        />
      ) : null}
      <button id="below" type="button">
        Below
      </button>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  reduced: () => <Page motion="reduced" />,
  refused: () => <Page refuse />,
};
