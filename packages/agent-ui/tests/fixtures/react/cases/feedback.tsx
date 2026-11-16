import type { FeedbackRating, MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Feedback } from "../../../../src/react/feedback.js";
import { feedbackHost } from "../../shared/feedback.js";

const { host, record, comment } = feedbackHost();

function Page({
  motion,
  controlled = false,
  refuse = false,
}: {
  motion?: MotionMode;
  controlled?: boolean;
  refuse?: boolean;
}) {
  const [commentSent, setCommentSent] = useState(false);
  const [rating, setRating] = useState<FeedbackRating>(null);
  useEffect(() => {
    Object.assign(window, { kindHost: { ...host, setCommentSent } });
  }, []);
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p id="above">Above</p>
      <div className="flex items-center gap-2">
        <Feedback
          id="feedback"
          {...((controlled || refuse) && { rating })}
          onRatingChange={(next, details) => {
            record(next, details);
            if (!refuse) setRating(next);
          }}
          onComment={comment}
          commentSent={commentSent}
          motion={motion}
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
