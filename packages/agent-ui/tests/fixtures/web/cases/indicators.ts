import { defineLoader } from "../../../../src/web/loader.js";
import { defineStreamingText } from "../../../../src/web/streaming-text.js";
import { defineThinkingIndicator } from "../../../../src/web/thinking-indicator.js";
import { defineTypingIndicator } from "../../../../src/web/typing-indicator.js";

export const cases = {
  all: (root: HTMLElement) => {
    defineLoader();
    defineThinkingIndicator();
    defineTypingIndicator();
    defineStreamingText();
    root.innerHTML = `
      <div class="flex max-w-md flex-col items-start gap-6 p-6">
        <kind-loader></kind-loader>
        <kind-thinking-indicator></kind-thinking-indicator>
        <kind-typing-indicator></kind-typing-indicator>
        <p class="text-sm leading-6"><kind-streaming-text text="Streaming text fades in" caret></kind-streaming-text></p>
      </div>`;
    const text = root.querySelector("kind-streaming-text") as HTMLElement & { text: string };
    Object.assign(window, { kindStream: { set: (next: string) => (text.text = next) } });
  },
};
