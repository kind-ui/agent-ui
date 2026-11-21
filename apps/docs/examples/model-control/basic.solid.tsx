import type { EffortLevel, ModelOption, SettingsEntry, SettingsValues } from "@kind-ui/agent-ui";
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";
import { ModelControl } from "@/components/ui/solid/model-control";

// Logos from Lobe Icons (@lobehub/icons-static-svg 1.103.0, MIT), see THIRD_PARTY_NOTICES.md.
function AnthropicLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true">
      <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
    </svg>
  );
}

function OpenAILogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true">
      <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.49 2H2v9.492h9.492V2h-.002z" fill="#F25022" />
      <path d="M22 2h-9.492v9.492H22V2z" fill="#7FBA00" />
      <path d="M11.49 12.508H2V22h9.492v-9.492h-.002z" fill="#00A4EF" />
      <path d="M22 12.508h-9.492V22H22v-9.492z" fill="#FFB900" />
    </svg>
  );
}

// An icon is a function, so the trigger and the menu each draw their own copy.
const models: ModelOption<() => JSX.Element>[] = [
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: AnthropicLogo },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: AnthropicLogo },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: OpenAILogo },
  {
    id: "gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    group: "OpenAI",
    icon: OpenAILogo,
    efforts: ["low", "medium"],
  },
  { id: "mai-code-2-flash", name: "MAI Code 2 Flash", group: "Microsoft", icon: MicrosoftLogo, efforts: [] },
];

const moreModels: ModelOption<() => JSX.Element>[] = [
  { id: "mai-code-2", name: "MAI Code 2", group: "Microsoft", icon: MicrosoftLogo },
];

const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra High" },
  { value: "max", label: "Max" },
];

const settings: SettingsEntry<JSX.Element>[] = [
  { type: "toggle", id: "fast", label: "Fast mode" },
  {
    type: "choice",
    id: "context",
    label: "Context window",
    options: [
      { value: "200k", label: "200K" },
      { value: "1m", label: "1M" },
    ],
  },
];

const actions = [{ id: "more", label: "More models" }];

export default function ModelControlExample() {
  const [model, setModel] = createSignal<string | null>("claude-opus-5.5");
  const [effort, setEffort] = createSignal("medium");
  const [values, setValues] = createSignal<SettingsValues>({ fast: false, context: "1m" });
  const [showAll, setShowAll] = createSignal(false);

  return (
    <ModelControl
      models={showAll() ? [...models, ...moreModels] : models}
      model={model()}
      onModelChange={setModel}
      levels={levels}
      effort={effort()}
      onEffortChange={setEffort}
      settings={settings}
      values={values()}
      onValuesChange={setValues}
      actions={showAll() ? undefined : actions}
      onAction={showAll() ? undefined : () => setShowAll(true)}
    />
  );
}
