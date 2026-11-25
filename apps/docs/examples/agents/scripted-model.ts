import type { AgentComponent, AgentStep } from "@ui-sdk/react/agent";

export type Vocabulary = {
  models: { id: string; name: string }[];
  levels: { value: string; label: string }[];
  modes: { value: string; label: string }[];
};

type Call = (name: "snapshot" | "act", input: object) => Promise<unknown>;

const words = (text: string): string[] => text.toLowerCase().match(/[a-z0-9.]+/g) ?? [];

// A model's name matches when the instruction holds a word no other model's name has, like "opus".
function findModel(said: string[], models: Vocabulary["models"]) {
  return models.find((model) =>
    words(model.name).some(
      (word) =>
        said.includes(word) && models.every((other) => other === model || !words(other.name).includes(word)),
    ),
  );
}

// The longest label the instruction holds, so "extra high" wins over "high".
function findLabel<T extends { label: string }>(text: string, options: T[]) {
  const said = ` ${words(text).join(" ")} `;
  return [...options]
    .sort((a, b) => b.label.length - a.label.length)
    .find((option) => said.includes(` ${words(option.label).join(" ")} `));
}

/**
 * Plays one turn of a model that has the page's WebMCP tools: it reads the page with `snapshot`, plans every step
 * from the instruction's words, and sends them in one `act`. A real model does the same with the tools'
 * descriptions; this one only knows the words in `vocabulary`, so the demo runs without an API key.
 */
export async function scriptedTurn(instruction: string, vocabulary: Vocabulary, call: Call): Promise<string> {
  const page = (await call("snapshot", {})) as AgentComponent[];
  const find = (component: string) => page.find((entry) => entry.component === component);
  const control = find("kind-model-control");
  const approvals = find("kind-approval-mode");
  const approval = page.find(
    (entry) => entry.component === "kind-confirmation" && entry.actions.includes("approve"),
  );

  const said = words(instruction);
  const model = findModel(said, vocabulary.models);
  const level = findLabel(instruction, vocabulary.levels);
  const mode = findLabel(instruction, vocabulary.modes);
  const decision = said.includes("approve")
    ? "approve"
    : said.some((word) => /^(deny|reject)$/.test(word))
      ? "deny"
      : undefined;

  const steps: AgentStep[] = [];
  if (control && model) steps.push({ ref: control.ref, action: "setModel", args: [model.id] });
  if (control && level) steps.push({ ref: control.ref, action: "setEffort", args: [level.value] });
  if (approvals && mode) steps.push({ ref: approvals.ref, action: "setValue", args: [mode.value] });
  if (approval && decision) steps.push({ ref: approval.ref, action: decision });

  if (steps.length === 0) {
    return decision && !approval
      ? "There's no approval waiting."
      : "I can switch the model, the effort or the approval mode, and approve or deny the tool.";
  }
  const result = (await call("act", { steps })) as { ok: boolean; error?: { message: string } };
  return result.ok
    ? `Done: ${steps.length} ${steps.length === 1 ? "change" : "changes"}.`
    : `Stopped: ${result.error?.message}`;
}
