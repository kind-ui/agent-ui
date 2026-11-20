import {
  type FeedbackApi,
  type FeedbackRating,
  type FeedbackRatingChangeReason,
  type FeedbackState,
  feedbackPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import type { PopoverOpenChangeReason } from "@ui-sdk/core/popover";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import "@ui-sdk/web/toggle";
import { defineInternalTextarea } from "./internal/textarea.js";

const THUMB = (value: "up" | "down", label: string) =>
  `<ui-toggle value="${value}"><button aria-label="${label}" data-kind-icon-button data-kind-size="sm"><ui-toggle-icon data-feedback-icon="${value}"></ui-toggle-icon></button></ui-toggle>`;

const DEFAULT_PARTS = `<kind-feedback-thumbs><ui-toggle-group data-agent-hidden>${THUMB("up", "Good response")}${THUMB("down", "Bad response")}</ui-toggle-group></kind-feedback-thumbs><kind-feedback-comment><button>Add a comment</button></kind-feedback-comment><kind-feedback-thanks>Thanks for your feedback</kind-feedback-thanks><kind-feedback-content hidden><kind-feedback-title><h2>Add a comment</h2></kind-feedback-title><kind-feedback-comment-text><kind-internal-textarea><ui-textarea><textarea rows="3"></textarea></ui-textarea></kind-internal-textarea></kind-feedback-comment-text><div data-feedback-actions><kind-feedback-comment-status><kind-feedback-comment-status-icon></kind-feedback-comment-status-icon>Sending</kind-feedback-comment-status><kind-feedback-comment-error>Comment not sent. Try again.</kind-feedback-comment-error><kind-feedback-comment-send><button>Send</button></kind-feedback-comment-send></div></kind-feedback-content>`;

// The text box this element filled in. Kept across instances, since UI SDK rebuilds one when the element returns.
const owned = new WeakSet<Element>();

const write = <Target extends object, Key extends keyof Target>(
  target: Target | null,
  key: Key,
  value: Target[Key],
) => {
  if (target && target[key] !== value) target[key] = value;
};

/**
 * `<kind-feedback>` fills in its parts when it has no children. Pressing a thumb fires `ratingchange` with the rating
 * as `detail.value`. The `can-comment` attribute shows "Add a comment" once there's a rating, whose Send fires
 * `comment` with the text as `detail.value`: call `event.detail.waitUntil(promise)` to keep Send disabled until it
 * settles.
 */
export function defineFeedback(): void {
  if (customElements.get("kind-feedback")) return;
  defineInternalTextarea();
  createParts(feedbackPrimitive, {
    root: {
      tag: "kind-feedback",
      kinds: { canComment: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindFeedbackElement).canComment ? {} : { onComment: undefined }),
      state: {
        rating: {
          get: (api) => api.getRating(),
          set: (api, rating) => api.rate(rating as FeedbackRating),
        },
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["getRating", "rate", "isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) {
          el.innerHTML = DEFAULT_PARTS;
          const filled = el.querySelector("kind-feedback-comment-text textarea");
          if (filled) owned.add(filled);
        }
        const api = instance.api as FeedbackApi;
        const draw = () => {
          const state = instance.get() as FeedbackState;
          const { controller, "aria-label": ariaLabel } = api.thumbsState();
          const group = el.querySelector<Element & { controller?: unknown }>(
            "kind-feedback-thumbs ui-toggle-group",
          );
          write(group, "controller", controller);
          write(group, "ariaLabel", ariaLabel);
          api.syncRating();
          const text = api.commentTextState(state);
          write(
            el.querySelector<Element & { controller?: unknown }>("kind-feedback-comment-text ui-textarea"),
            "controller",
            text.controller,
          );
          const textarea = el.querySelector<HTMLTextAreaElement>("kind-feedback-comment-text textarea");
          write(textarea, "readOnly", text.readOnly);
          // A text box someone wrote keeps its own words.
          if (textarea && owned.has(textarea)) {
            write(textarea, "placeholder", text.placeholder);
            write(textarea, "ariaLabel", text["aria-label"]);
          }
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    thumbs: { tag: "kind-feedback-thumbs", display: "contents" },
    comment: { tag: "kind-feedback-comment", target: wrappedButton, display: "contents" },
    thanks: "kind-feedback-thanks",
    content: "kind-feedback-content",
    title: { tag: "kind-feedback-title", target: wrappedChild("h2"), display: "contents" },
    "comment-text": "kind-feedback-comment-text",
    "comment-send": { tag: "kind-feedback-comment-send", target: wrappedButton, display: "contents" },
    "comment-status": "kind-feedback-comment-status",
    "comment-status-icon": "kind-feedback-comment-status-icon",
    "comment-error": "kind-feedback-comment-error",
  });
}

export type KindFeedbackEvents = {
  ratingchange: UiChangeEvent<FeedbackRating, FeedbackRatingChangeReason>;
  comment: CustomEvent<{ value: string } & ActionDetails & Pick<UiActionDetail, "waitUntil">>;
  openchange: UiChangeEvent<boolean, PopoverOpenChangeReason>;
};

export interface KindFeedbackElement
  extends UiElement<KindFeedbackEvents>,
    AttributeProperties<typeof feedbackPrimitive, "api" | "rating" | "defaultRating" | "open"> {
  canComment: boolean;
  rating: FeedbackRating;
  defaultRating?: FeedbackRating;
  open: boolean;
  api: Pick<FeedbackApi, "getRating" | "rate" | "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-feedback": KindFeedbackElement;
    "kind-feedback-thumbs": HTMLElement;
    "kind-feedback-comment": HTMLElement;
    "kind-feedback-thanks": HTMLElement;
    "kind-feedback-content": HTMLElement;
    "kind-feedback-title": HTMLElement;
    "kind-feedback-comment-text": HTMLElement;
    "kind-feedback-comment-send": HTMLElement;
    "kind-feedback-comment-status": HTMLElement;
    "kind-feedback-comment-status-icon": HTMLElement;
    "kind-feedback-comment-error": HTMLElement;
  }
}
