<script lang="ts">
  import { Suggestion } from "@/components/ui/svelte/suggestion/index.js";

  const suggestions = [
    { id: "summarize", label: "Summarize this thread" },
    { id: "reply", label: "Draft a reply", description: "Short and friendly" },
    { id: "questions", label: "List the open questions" },
    { id: "issues", label: "Find related issues" },
    { id: "tests", label: "Suggest a test plan" },
  ];

  let prompt: string | undefined = $state();
</script>

<div class="flex w-full max-w-md flex-col gap-3">
  <Suggestion
    {suggestions}
    onPick={(id: string) => (prompt = suggestions.find((suggestion) => suggestion.id === id)?.label)}
  />
  <p class="text-sm text-[var(--kind-color-muted)]">
    {prompt ? `Sent: ${prompt}` : "Nothing sent yet."}
  </p>
</div>
