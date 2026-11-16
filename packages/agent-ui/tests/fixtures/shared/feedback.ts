import type { FeedbackCommentCallback, FeedbackRating } from "@kind-ui/agent-ui/core";

export type Comment = { text: string; source: string; resolve(): void; reject(): void };

export function feedbackHost() {
  const ratings: { rating: FeedbackRating; reason: string; source: string }[] = [];
  const comments: Comment[] = [];
  const record = (rating: FeedbackRating, details: { reason: string; source: string }) =>
    ratings.push({ rating, reason: details.reason, source: details.source });
  const comment: FeedbackCommentCallback = (text, details) =>
    new Promise<void>((resolve, reject) => comments.push({ text, source: details.source, resolve, reject }));
  return { host: { ratings, comments }, record, comment };
}
