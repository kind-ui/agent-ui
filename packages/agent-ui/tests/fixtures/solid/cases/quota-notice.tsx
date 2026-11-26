import { createSignal, onSettled, Show } from "solid-js";
import { QuotaNotice } from "../../../../src/solid/quota-notice.js";
import { expose } from "../../shared/expose.js";
import { clock, quota, quotaHost, spent } from "../../shared/quota-notice.js";

const host = quotaHost();

function Page(props: { ticking?: boolean }) {
  const [used, setUsed] = createSignal(quota.used);
  const [shown, setShown] = createSignal(true);
  onSettled(() => expose({ kindHost: Object.assign(host, { setUsed: (value: number) => setUsed(value) }) }));
  return (
    <div class="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      <Show when={shown()}>
        <QuotaNotice
          id="quota"
          used={used()}
          limit={quota.limit}
          period={quota.period}
          resetAt={props.ticking ? clock.resetAt : quota.resetAt}
          now={props.ticking ? undefined : quota.now}
          onUpgrade={(details) => host.upgrades.push(details.source)}
          onDismiss={() => {
            host.dismisses += 1;
            setShown(false);
          }}
        />
      </Show>
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
