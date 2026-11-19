import { ModelSelector } from "@/components/ui/model-selector";
import { AnthropicLogo, GoogleMonogram, OpenAILogo, XAILogo } from "./logos";

const models = [
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gemini-4-argon", name: "Gemini 4 Argon", group: "Google", icon: <GoogleMonogram /> },
  { id: "grok-4.7", name: "Grok 4.7", group: "xAI", icon: <XAILogo /> },
];

export default function ModelSelectorGroupsExample() {
  return <ModelSelector models={models} pages="groups" defaultValue="gpt-6.1-sol" />;
}
