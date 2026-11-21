import { Suggestion } from "../components/ui/solid/suggestion.js";

export default function SuggestionItem() {
  return <Suggestion suggestions={[{ id: "a", label: "Summarize this thread" }]} onPick={() => {}} />;
}
