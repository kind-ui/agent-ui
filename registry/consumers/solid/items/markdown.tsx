import { Markdown } from "../components/ui/solid/markdown.js";

export default function MarkdownItem() {
  return <Markdown source={"# Title\n\nSome **bold** text.\n\n```ts\nconst a = 1;\n```\n"} />;
}
