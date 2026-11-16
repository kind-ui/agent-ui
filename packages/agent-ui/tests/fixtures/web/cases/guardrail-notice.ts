import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineGuardrailNotice } from "../../../../src/web/guardrail-notice.js";
import { guardrails, noticeHost } from "../../shared/notice.js";

const { host, dismissed } = noticeHost();

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineGuardrailNotice();
    const container = document.createElement("div");
    container.className = "flex w-[30rem] flex-col gap-3 p-6";
    const button = (id: string, text: string) =>
      Object.assign(document.createElement("button"), { id, type: "button", textContent: text });
    const below = button("below", "Below");
    const create = (id: string, options: Partial<HTMLElementTagNameMap["kind-guardrail-notice"]>) => {
      const notice = Object.assign(document.createElement("kind-guardrail-notice"), options);
      notice.id = `guardrail-${id}`;
      if (motion) notice.motion = motion;
      return notice;
    };
    const blocking = create("blocking", { ...guardrails.blocking, blocking: true, canDismiss: true });
    blocking.addEventListener("dismiss", (event) => {
      event.detail.waitUntil(Promise.resolve(dismissed("blocking")).then(() => blocking.remove()));
    });
    const filtered = create("filtered", { ...guardrails.filtered, variant: "info" });
    container.append(button("above", "Above"), blocking, filtered, below);
    root.append(container);
    Object.assign(window, {
      kindHost: Object.assign(host, {
        add: () =>
          below.before(
            create("late", {
              label: "Request blocked",
              reason: "The prompt asked for malware.",
              blocking: true,
            }),
          ),
      }),
    });
  };

export const cases = { all: page(), reduced: page({ motion: "reduced" }) };
