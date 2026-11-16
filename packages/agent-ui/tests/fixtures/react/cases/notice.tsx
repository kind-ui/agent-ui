import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Notice } from "../../../../src/react/notice.js";
import { added, type NoticeData, noticeHost, notices } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

function Page({ motion, fallback }: { motion?: MotionMode; fallback?: boolean }) {
  const [items, setItems] = useState(notices);
  useEffect(() => {
    Object.assign(window, {
      kindHost: Object.assign(host, {
        add: () => setItems((current) => [...current, added]),
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
          {...(item.dismissible && { onDismiss: dismiss(item) })}
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

export const cases = {
  all: () => <Page />,
  fallback: () => <Page fallback />,
  reduced: () => <Page motion="reduced" />,
};
