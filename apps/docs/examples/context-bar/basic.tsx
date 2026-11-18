"use client";
import { useRef, useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ContextBar } from "@/components/ui/context-bar";

const context = [
  { id: "layout", label: "src/app/layout.tsx", kind: "file" },
  { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection" },
  { id: "components", label: "src/components", kind: "folder" },
  { id: "session", label: "src/lib/session.ts", kind: "file" },
  { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url" },
  { id: "middleware", label: "middleware.ts", kind: "file" },
  { id: "env", label: ".env.example", kind: "file" },
];

export default function ContextBarExample() {
  const [chips, setChips] = useState(context);
  const editor = useRef<HTMLDivElement>(null);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <ContextBar
        chips={chips}
        onRemove={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        focusFallback={() => editor.current}
      />
      <Composer aria-label="Message">
        <ComposerInput ref={editor} aria-label="Prompt" placeholder="Ask about this context" />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}
