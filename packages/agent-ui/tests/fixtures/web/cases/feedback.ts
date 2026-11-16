import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineFeedback } from "../../../../src/web/feedback.js";
import { feedbackHost } from "../../shared/feedback.js";

const { host, record, comment } = feedbackHost();

const page =
  ({ motion, controlled = false }: { motion?: MotionMode; controlled?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineFeedback();
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-start gap-4 p-6";
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";
    const feedback = document.createElement("kind-feedback");
    feedback.id = "feedback";
    feedback.canComment = true;
    if (motion) feedback.motion = motion;
    if (controlled) feedback.rating = null;
    feedback.addEventListener("ratingchange", (event) => {
      record(event.detail.value, event.detail);
      if (controlled) feedback.rating = event.detail.value;
    });
    feedback.addEventListener("comment", (event) => {
      event.detail.waitUntil(Promise.resolve(comment(event.detail.value, event.detail)));
    });
    const beside = Object.assign(document.createElement("button"), {
      id: "beside",
      type: "button",
      textContent: "Beside",
    });
    row.append(feedback, beside);
    wrapper.append(above, row);
    root.append(wrapper);
    Object.assign(window, {
      kindHost: {
        ...host,
        setCommentSent: (sent: boolean) => {
          feedback.commentSent = sent;
        },
      },
    });
  };

export const cases = {
  all: page(),
  controlled: page({ controlled: true }),
  reduced: page({ motion: "reduced" }),
};
