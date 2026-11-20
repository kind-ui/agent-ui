import type { SuggestionItem as Item } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import {
  Suggestion,
  SuggestionControls,
  SuggestionItem,
  SuggestionNext,
  SuggestionPrevious,
  SuggestionViewport,
} from "../../../../src/react/suggestion.js";
import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

const { host, record } = suggestionHost();

function Page({
  initial = suggestions,
  motion,
  pickable = true,
  width,
  inForm,
  custom,
  wrap,
}: {
  initial?: Item[];
  motion?: MotionMode;
  pickable?: boolean;
  width?: number;
  inForm?: boolean;
  custom?: boolean;
  wrap?: boolean;
}) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindHost: {
        ...host,
        add: () => setItems((current) => [...current, added]),
        remove: () => setItems((current) => current.filter((item) => item.id !== "b")),
        rename: () =>
          setItems((current) =>
            current.map((item) => (item.id === "a" ? { ...item, label: "Summarize it" } : item)),
          ),
      },
    });
  }, []);
  const suggestion = (
    <Suggestion
      id="suggestion"
      suggestions={items}
      {...(pickable && { onPick: record })}
      motion={motion}
      {...(wrap && { layout: "wrap" as const })}
    >
      {custom ? (
        <>
          <SuggestionViewport>
            {items.map((item) => (
              <SuggestionItem key={item.id} value={item.id} />
            ))}
          </SuggestionViewport>
          <SuggestionControls>
            <SuggestionPrevious />
            <SuggestionNext />
          </SuggestionControls>
        </>
      ) : undefined}
    </Suggestion>
  );
  return (
    <div className="flex flex-col gap-4 p-6" style={width ? { width } : undefined}>
      <p id="above">Above</p>
      {inForm ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            host.submits.push("submit");
          }}
        >
          {suggestion}
        </form>
      ) : (
        suggestion
      )}
      <p id="below">Below</p>
    </div>
  );
}

export const cases = {
  all: () => <Page />,
  overflow: () => <Page initial={manySuggestions} width={360} />,
  reduced: () => <Page motion="reduced" />,
  static: () => <Page pickable={false} />,
  form: () => <Page inForm />,
  custom: () => <Page custom />,
  wrap: () => <Page initial={manySuggestions} width={360} wrap />,
};
