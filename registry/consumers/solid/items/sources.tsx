import { Sources } from "../components/ui/solid/sources.js";

export default function SourcesItem() {
  return <Sources sources={[{ id: "docs", title: "Rate limits", url: "https://docs.github.com/en/rest" }]} />;
}
