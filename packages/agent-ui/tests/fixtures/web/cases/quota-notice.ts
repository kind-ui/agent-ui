import { defineQuotaNotice } from "../../../../src/web/quota-notice.js";
import { clock, quota, quotaHost, spent } from "../../shared/quota-notice.js";

const host = quotaHost();

const page =
  ({ ticking = false }: { ticking?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineQuotaNotice();
    const container = document.createElement("div");
    container.className = "flex w-[30rem] flex-col gap-3 p-6";
    const button = (id: string, text: string) =>
      Object.assign(document.createElement("button"), { id, type: "button", textContent: text });
    const notice = document.createElement("kind-quota-notice");
    notice.id = "quota";
    notice.used = quota.used;
    notice.limit = quota.limit;
    notice.period = quota.period;
    if (ticking) notice.resetAt = clock.resetAt;
    else Object.assign(notice, { resetAt: quota.resetAt, now: quota.now });
    notice.canUpgrade = true;
    notice.addEventListener("upgrade", (event) => host.upgrades.push(event.detail.source));
    notice.canDismiss = true;
    notice.addEventListener("dismiss", () => {
      host.dismisses += 1;
      notice.remove();
    });
    const spentNotice = document.createElement("kind-quota-notice");
    spentNotice.id = "quota-spent";
    Object.assign(spentNotice, spent);
    const description = document.createElement("kind-quota-notice-description");
    description.textContent = "Answers use a smaller model until your plan renews.";
    spentNotice.append(description);
    container.append(button("above", "Above"), notice, spentNotice, button("below", "Below"));
    root.append(container);
    Object.assign(window, {
      kindHost: Object.assign(host, {
        setUsed: (used: number) => {
          notice.used = used;
        },
      }),
    });
  };

export const cases = {
  all: page(),
  clock: page({ ticking: true }),
};
