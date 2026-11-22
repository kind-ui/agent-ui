import { createSignal } from "solid-js";
import { Markdown } from "@/components/ui/solid/markdown";
import { Selection } from "@/components/ui/solid/selection";

const actions = [
  { id: "ask", label: "Ask", description: "Ask about the selected text" },
  { id: "quote", label: "Quote", description: "Quote it in your reply" },
  { id: "copy", label: "Copy" },
];

const reply =
  "Three requests timed out after 30 seconds. Add a retry with exponential backoff to `fetchOrders`, and cap it at three attempts so a slow server can't hold the queue.";

export default function SelectionExample() {
  const [chosen, setChosen] = createSignal<string>();
  return (
    <div class="flex w-full max-w-md flex-col gap-3">
      <Selection
        actions={actions}
        onAction={({ actionId, text }) => {
          if (actionId === "copy") void navigator.clipboard.writeText(text);
          else setChosen(`${actionId === "ask" ? "Asked about" : "Quoted"}: “${text}”`);
        }}
      >
        <Markdown source={reply} />
      </Selection>
      <p class="text-sm text-[var(--kind-color-muted)]">{chosen() ?? "Nothing chosen yet."}</p>
    </div>
  );
}
