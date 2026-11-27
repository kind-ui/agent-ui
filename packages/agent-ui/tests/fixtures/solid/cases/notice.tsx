import type { MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled, Show } from "solid-js";
import { Notice } from "../../../../src/solid/notice.js";
import { expose } from "../../shared/expose.js";
import { added, type NoticeData, noticeHost, notices, quotaNotices } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

function Page(props: { motion?: MotionMode; fallback?: boolean }) {
  const [items, setItems] = createSignal(notices);
  onSettled(() =>
    expose({
      kindHost: Object.assign(host, {
        add: () => setItems((current) => [...current, added]),
        remove: () => setItems((current) => current.filter((item) => item.id !== "error")),
        escalate: () =>
          setItems((current) =>
            current.map((item) => (item.id === "info" ? { ...item, variant: "error" as const } : item)),
          ),
        edit: () =>
          setItems((current) =>
            current.map((item) => (item.id === "info" ? { ...item, text: "Almost done." } : item)),
          ),
      }),
    }),
  );
  const dismiss = (item: NoticeData) => async () => {
    await dismissed(item.id);
    setItems((current) => current.filter((other) => other.id !== item.id));
  };
  return (
    <div class="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      <For each={items()} keyed={(item) => item.id}>
        {(item) => (
          <Notice
            id={`notice-${item().id}`}
            variant={item().variant}
            label={item().label}
            motion={props.motion}
            onDismiss={item().dismissible ? dismiss(item()) : undefined}
            dismissible={item().dismissible || undefined}
            focusFallback={props.fallback ? () => document.getElementById("above") : undefined}
            actions={
              <Show when={item().action}>
                <button type="button">{item().action}</button>
              </Show>
            }
          >
            {item().text}
          </Notice>
        )}
      </For>
      <button id="below" type="button">
        Below
      </button>
    </div>
  );
}

function Quota() {
  return (
    <div class="flex w-[36rem] flex-col gap-3 p-6">
      <For each={quotaNotices()} keyed={(item) => item.id}>
        {(item) => (
          <Notice
            id={`notice-${item().id}`}
            variant={item().variant}
            label={item().label}
            resetsAt={item().resetsAt}
            onDismiss={() => dismissed(item().id)}
            actions={
              <For each={item().actions} keyed={(action) => action}>
                {(action, index) => (
                  <button
                    type="button"
                    data-kind-button={index() === item().actions.length - 1 ? "secondary" : ""}
                  >
                    {action()}
                  </button>
                )}
              </For>
            }
          >
            {item().text}
          </Notice>
        )}
      </For>
    </div>
  );
}

export const cases = {
  quota: () => <Quota />,
  all: () => <Page />,
  fallback: () => <Page fallback />,
  reduced: () => <Page motion="reduced" />,
};
