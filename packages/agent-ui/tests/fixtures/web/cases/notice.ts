import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineNotice } from "../../../../src/web/notice.js";
import { added, type NoticeData, noticeHost, notices } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

const page =
  ({ motion, fallback = false }: { motion?: MotionMode; fallback?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineNotice();
    const container = document.createElement("div");
    container.className = "flex w-[30rem] flex-col gap-3 p-6";
    const button = (id: string, text: string) =>
      Object.assign(document.createElement("button"), { id, type: "button", textContent: text });
    const above = button("above", "Above");
    const below = button("below", "Below");
    const create = (item: NoticeData) => {
      const notice = document.createElement("kind-notice");
      notice.id = `notice-${item.id}`;
      notice.variant = item.variant;
      notice.label = item.label;
      if (motion) notice.motion = motion;
      if (fallback) notice.focusFallback = () => above;
      const description = document.createElement("kind-notice-description");
      description.textContent = item.text;
      notice.append(description);
      if (item.action) {
        const actions = document.createElement("kind-notice-actions");
        actions.append(button(`${item.id}-action`, item.action));
        notice.append(actions);
      }
      if (item.dismissible) {
        notice.canDismiss = true;
        notice.addEventListener("dismiss", (event) => {
          const removal = Promise.resolve(dismissed(item.id)).then(() => notice.remove());
          event.detail.waitUntil(removal);
        });
      }
      return notice;
    };
    const elements = new Map(notices.map((item) => [item.id, create(item)]));
    container.append(above, ...elements.values(), below);
    root.append(container);
    Object.assign(window, {
      kindHost: Object.assign(host, {
        add: () => below.before(create(added)),
        remove: () => elements.get("error")?.remove(),
        escalate: () => {
          const info = elements.get("info");
          if (info) info.variant = "error";
        },
        edit: () => {
          const description = elements.get("info")?.querySelector("kind-notice-description");
          if (description) description.textContent = "Almost done.";
        },
      }),
    });
  };

export const cases = {
  all: page(),
  fallback: page({ fallback: true }),
  reduced: page({ motion: "reduced" }),
};
