"use client";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Sidebar, SidebarHandle, SidebarInset, SidebarPanel, SidebarTrigger } from "@/components/ui/sidebar";

type Line = { id: string; role: "user" | "assistant"; text: string };

const first: Line[] = [
  { id: "m1", role: "user", text: "Why did the nightly export fail?" },
  {
    id: "m2",
    role: "assistant",
    text: "Every run since Wednesday stopped after 30 seconds waiting on the reports service.",
  },
];

export default function SidebarAssistantExample() {
  const [lines, setLines] = useState(first);

  return (
    <Sidebar
      side="end"
      label="Assistant"
      defaultSize="320px"
      className="h-[420px] w-full overflow-hidden rounded-xl border border-[var(--kind-color-border)]"
    >
      <SidebarInset>
        <header className="flex items-center justify-between gap-2 border-b border-[var(--kind-color-border)] px-3 py-2">
          <h3 className="m-0 text-sm font-medium">billing-export.ts</h3>
          <SidebarTrigger />
        </header>
        <pre className="m-0 flex-1 overflow-auto p-4 text-xs">
          {
            "export async function run() {\n  const pages = await reports.list({ timeout: 30_000 });\n  await upload(pages);\n}"
          }
        </pre>
      </SidebarInset>
      <SidebarHandle />
      <SidebarPanel>
        <Conversation
          aria-label="Assistant conversation"
          messageCount={lines.length}
          className="min-h-0 flex-1"
        >
          <ConversationViewport>
            <ConversationContent>
              {lines.map((line, index) => (
                <ConversationRow key={line.id} value={line.id} index={index}>
                  <p
                    className={
                      line.role === "user"
                        ? "ms-auto w-fit max-w-[85%] rounded-2xl bg-[var(--kind-color-hover)] px-3 py-1.5 text-sm"
                        : "text-sm"
                    }
                  >
                    {line.text}
                  </p>
                </ConversationRow>
              ))}
            </ConversationContent>
          </ConversationViewport>
          <ConversationJump />
        </Conversation>
        <div className="p-2">
          <Composer
            aria-label="Message"
            onSubmit={(draft) =>
              setLines((current) => [
                ...current,
                { id: `m${current.length + 1}`, role: "user", text: draft.text },
              ])
            }
          >
            <ComposerInput aria-label="Prompt" placeholder="Ask about this file" />
            <ComposerSubmit />
          </Composer>
        </div>
      </SidebarPanel>
    </Sidebar>
  );
}
