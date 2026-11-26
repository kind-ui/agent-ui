import { useEffect, useState } from "react";
import { QuotaNotice } from "../../../../src/react/quota-notice.js";
import { expose } from "../../shared/expose.js";
import { clock, quota, quotaHost, spent } from "../../shared/quota-notice.js";

const host = quotaHost();

function Page({ ticking = false }: { ticking?: boolean }) {
  const [used, setUsed] = useState(quota.used);
  const [shown, setShown] = useState(true);
  useEffect(() => expose({ kindHost: Object.assign(host, { setUsed }) }), []);
  return (
    <div className="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      {shown ? (
        <QuotaNotice
          id="quota"
          used={used}
          limit={quota.limit}
          period={quota.period}
          {...(ticking ? { resetAt: clock.resetAt } : { resetAt: quota.resetAt, now: quota.now })}
          onUpgrade={(details) => host.upgrades.push(details.source)}
          onDismiss={() => {
            host.dismisses += 1;
            setShown(false);
          }}
        />
      ) : null}
      <QuotaNotice id="quota-spent" used={spent.used} limit={spent.limit} unit={spent.unit}>
        Answers use a smaller model until your plan renews.
      </QuotaNotice>
      <button id="below" type="button">
        Below
      </button>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  clock: () => <Page ticking />,
};
