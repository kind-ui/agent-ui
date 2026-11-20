import type { SuggestionItem } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineSuggestion } from "../../../../src/web/suggestion.js";
import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

const { host, record } = suggestionHost();

const page =
  ({
    initial = suggestions,
    motion,
    pickable = true,
    width,
    inForm = false,
    wrap = false,
  }: {
    initial?: SuggestionItem[];
    motion?: MotionMode;
    pickable?: boolean;
    width?: number;
    inForm?: boolean;
    wrap?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineSuggestion();
    const container = document.createElement("div");
    container.className = "flex flex-col gap-4 p-6";
    if (width) container.style.width = `${width}px`;
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const suggestion = document.createElement("kind-suggestion");
    suggestion.id = "suggestion";
    suggestion.suggestions = initial;
    suggestion.canPick = pickable;
    if (motion) suggestion.motion = motion;
    if (wrap) suggestion.layout = "wrap";
    suggestion.addEventListener("pick", (event) => record(event.detail.value, event.detail));
    const below = Object.assign(document.createElement("p"), { id: "below", textContent: "Below" });
    if (inForm) {
      const form = document.createElement("form");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        host.submits.push("submit");
      });
      form.append(suggestion);
      container.append(above, form, below);
    } else container.append(above, suggestion, below);
    root.append(container);
    Object.assign(window, {
      kindHost: {
        ...host,
        add: () => {
          suggestion.suggestions = [...(suggestion.suggestions ?? []), added];
        },
        remove: () => {
          suggestion.suggestions = (suggestion.suggestions ?? []).filter((item) => item.id !== "b");
        },
        rename: () => {
          suggestion.suggestions = (suggestion.suggestions ?? []).map((item) =>
            item.id === "a" ? { ...item, label: "Summarize it" } : item,
          );
        },
      },
    });
  };

export const cases = {
  all: page(),
  overflow: page({ initial: manySuggestions, width: 360 }),
  reduced: page({ motion: "reduced" }),
  static: page({ pickable: false }),
  form: page({ inForm: true }),
  wrap: page({ initial: manySuggestions, width: 360, wrap: true }),
};
