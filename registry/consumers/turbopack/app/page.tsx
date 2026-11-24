// Items whose files import their siblings, built by `next build` with Next's default Turbopack settings.
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import { Markdown } from "@/components/ui/markdown";
import { Tool } from "@/components/ui/tool";

export default function Page() {
  return (
    <main>
      <Markdown source={"# Title\n\nSome **bold** text.\n"} />
      <Tool
        call={{
          toolCallId: "t1",
          name: "search_docs",
          dynamic: false,
          input: { state: "ready", value: { query: "steps" } },
          output: { state: "available", value: 0 },
        }}
      />
      <Composer aria-label="Message">
        <ComposerInput aria-label="Prompt" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </main>
  );
}
