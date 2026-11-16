import type { SuggestionItem } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Suggestion } from "../../../../src/react/suggestion.js";
import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

const { host, record } = suggestionHost();

function Page({
  initial = suggestions,
  motion,
  pickable = true,
  width,
}: {
  initial?: SuggestionItem[];
  motion?: MotionMode;
  pickable?: boolean;
  width?: number;
}) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        ...host,
        add: () => setItems((current) => [...current, added]),
        rename: () =>
          setItems((current) =>
            current.map((item) => (item.id === "a" ? { ...item, label: "Summarize it" } : item)),
          ),
      },
    });
  }, []);
  return (
    <div className="flex flex-col gap-4 p-6" style={width ? { width } : undefined}>
      <p id="above">Above</p>
      <Suggestion id="suggestion" suggestions={items} {...(pickable && { onPick: record })} motion={motion} />
      <p id="below">Below</p>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  overflow: () => <Page initial={manySuggestions} width={360} />,
  reduced: () => <Page motion="reduced" />,
  static: () => <Page pickable={false} />,
};
