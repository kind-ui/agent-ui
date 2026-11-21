import type { SuggestionItem as Item } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import { createSignal, For, onSettled, Show } from "solid-js";
import {
  Suggestion,
  SuggestionControls,
  SuggestionItem,
  SuggestionNext,
  SuggestionPrevious,
  SuggestionViewport,
} from "../../../../src/solid/suggestion.js";
import { expose } from "../../shared/expose.js";
import { added, manySuggestions, suggestionHost, suggestions } from "../../shared/suggestion.js";

const { host, record } = suggestionHost();

function Page(props: {
  initial?: Item[];
  motion?: MotionMode;
  pickable?: boolean;
  width?: number;
  inForm?: boolean;
  custom?: boolean;
  wrap?: boolean;
}) {
  const [items, setItems] = createSignal(props.initial ?? suggestions);
  onSettled(() =>
    expose({
      kindHost: {
        ...host,
        add: () => setItems((current) => [...current, added]),
        remove: () => setItems((current) => current.filter((item) => item.id !== "b")),
        rename: () =>
          setItems((current) =>
            current.map((item) => (item.id === "a" ? { ...item, label: "Summarize it" } : item)),
          ),
      },
    }),
  );
  const suggestion = (): JSX.Element => (
    <Suggestion
      id="suggestion"
      suggestions={items()}
      {...(props.pickable !== false ? { onPick: record } : {})}
      motion={props.motion}
      {...(props.wrap ? { layout: "wrap" as const } : {})}
    >
      {props.custom ? (
        <>
          <SuggestionViewport>
            <For each={items()} keyed={(item) => item.id}>
              {(item) => <SuggestionItem value={item().id} />}
            </For>
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
    <div class="flex flex-col gap-4 p-6" style={props.width ? { width: `${props.width}px` } : undefined}>
      <p id="above">Above</p>
      <Show when={props.inForm} fallback={suggestion()}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            host.submits.push("submit");
          }}
        >
          {suggestion()}
        </form>
      </Show>
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
