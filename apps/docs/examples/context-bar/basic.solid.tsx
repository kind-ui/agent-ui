import type { JSX } from "@solidjs/web";
import { createSignal, For } from "solid-js";
import { ContextBar } from "@/components/ui/solid/context-bar";

// Lucide "file", "folder", "square-dashed-text" and "link".
const glyph =
  (...paths: string[]) =>
  (): JSX.Element => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <For each={paths}>{(d) => <path d={d} />}</For>
    </svg>
  );

const icons = {
  file: glyph(
    "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
    "M14 2v5a1 1 0 0 0 1 1h5",
  ),
  folder: glyph(
    "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  ),
  selection: glyph(
    "M14 21h1",
    "M14 3h1",
    "M19 3a2 2 0 0 1 2 2",
    "M21 14v1",
    "M21 19a2 2 0 0 1-2 2",
    "M21 9v1",
    "M3 14v1",
    "M3 9v1",
    "M5 21a2 2 0 0 1-2-2",
    "M5 3a2 2 0 0 0-2 2",
    "M7 12h10",
    "M7 16h6",
    "M7 8h8",
    "M9 21h1",
    "M9 3h1",
  ),
  url: glyph(
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ),
};

const context = [
  { id: "layout", label: "src/app/layout.tsx", kind: "file", icon: icons.file },
  { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection", icon: icons.selection },
  { id: "components", label: "src/components", kind: "folder", icon: icons.folder },
  { id: "session", label: "src/lib/session.ts", kind: "file", icon: icons.file },
  { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url", icon: icons.url },
  { id: "middleware", label: "middleware.ts", kind: "file", icon: icons.file },
  { id: "env", label: ".env.example", kind: "file", icon: icons.file },
];

export default function ContextBarExample() {
  const [chips, setChips] = createSignal(context);
  let editor: HTMLTextAreaElement | undefined;

  return (
    <div class="flex w-full max-w-md flex-col gap-2">
      <ContextBar
        chips={chips()}
        onRemove={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        focusFallback={() => editor ?? null}
      />
      <textarea
        ref={(el) => {
          editor = el;
        }}
        aria-label="Prompt"
        placeholder="Ask about this context"
        class="min-h-16 rounded-lg border p-2"
      />
    </div>
  );
}
