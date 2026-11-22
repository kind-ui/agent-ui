import type { FeedbackRating, MotionMode } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Feedback } from "../../../../src/solid/feedback.js";
import { expose } from "../../shared/expose.js";
import { feedbackHost } from "../../shared/feedback.js";

const { host, record, comment } = feedbackHost();

function Page(props: { motion?: MotionMode; controlled?: boolean; refuse?: boolean }) {
  const [commentSent, setCommentSent] = createSignal(false);
  const [rating, setRating] = createSignal<FeedbackRating>(null);
  onSettled(() => expose({ kindHost: { ...host, setCommentSent } }));
  return (
    <div class="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div class="flex items-center gap-2">
        <Feedback
          id="feedback"
          {...(props.controlled || props.refuse
            ? {
                get rating() {
                  return rating();
                },
              }
            : {})}
          onRatingChange={(next, details) => {
            record(next, details);
            if (!props.refuse) setRating(next);
          }}
          onComment={comment}
          commentSent={commentSent()}
          motion={props.motion}
        />
        <button type="button" id="beside">
          Beside
        </button>
      </div>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  controlled: () => <Page controlled />,
  refuse: () => <Page refuse />,
  reduced: () => <Page motion="reduced" />,
};
