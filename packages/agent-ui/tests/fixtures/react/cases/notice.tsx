import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Notice } from "../../../../src/react/notice.js";
import { added, type NoticeData, noticeHost, notices, quotaNotices } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

function Page({ motion, fallback }: { motion?: MotionMode; fallback?: boolean }) {
  const [items, setItems] = useState(notices);
  useEffect(() => {
    Object.assign(window, {
      kindHost: Object.assign(host, {
        add: () => setItems((current) => [...current, added]),
        remove: () => setItems((current) => current.filter((item) => item.id !== "error")),
        escalate: () =>
          setItems((current) =>
            current.map((item) => (item.id === "info" ? { ...item, variant: "error" } : item)),
          ),
        edit: () =>
          setItems((current) =>
            current.map((item) => (item.id === "info" ? { ...item, text: "Almost done." } : item)),
          ),
      }),
    });
  }, []);
  const dismiss = (item: NoticeData) => async () => {
    await dismissed(item.id);
    setItems((current) => current.filter((other) => other.id !== item.id));
  };
  return (
    <div className="flex w-[30rem] flex-col gap-3 p-6">
      <button id="above" type="button">
        Above
      </button>
      {items.map((item) => (
        <Notice
          key={item.id}
          id={`notice-${item.id}`}
          variant={item.variant}
          label={item.label}
          motion={motion}
          {...(item.dismissible && { onDismiss: dismiss(item), dismissible: true })}
          {...(fallback && { focusFallback: () => document.getElementById("above") })}
          actions={item.action ? <button type="button">{item.action}</button> : undefined}
        >
          {item.text}
        </Notice>
      ))}
      <button id="below" type="button">
        Below
      </button>
    </div>
  );
}

function Quota() {
  return (
    <div className="flex w-[36rem] flex-col gap-3 p-6">
      {quotaNotices().map((item) => (
        <Notice
          key={item.id}
          id={`notice-${item.id}`}
          variant={item.variant}
          label={item.label}
          resetsAt={item.resetsAt}
          onDismiss={() => dismissed(item.id)}
          actions={item.actions.map((action, index) => (
            <button
              key={action}
              type="button"
              data-kind-button={index === item.actions.length - 1 ? "secondary" : ""}
            >
              {action}
            </button>
          ))}
        >
          {item.text}
        </Notice>
      ))}
    </div>
  );
}

export const cases = {
  quota: () => <Quota />,
  all: () => <Page />,
  fallback: () => <Page fallback />,
  reduced: () => <Page motion="reduced" />,
};
