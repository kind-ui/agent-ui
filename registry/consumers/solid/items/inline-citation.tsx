import { InlineCitation } from "../components/ui/solid/inline-citation.js";

export default function InlineCitationItem() {
  return (
    <p>
      Back off on a limit{" "}
      <InlineCitation
        sources={[{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }]}
      />
    </p>
  );
}
