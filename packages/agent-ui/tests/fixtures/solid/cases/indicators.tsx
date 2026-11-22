import { createSignal, onSettled } from "solid-js";
import { Loader } from "../../../../src/solid/loader.js";
import { StreamingText } from "../../../../src/solid/streaming-text.js";
import { ThinkingIndicator } from "../../../../src/solid/thinking-indicator.js";
import { TypingIndicator } from "../../../../src/solid/typing-indicator.js";
import { expose } from "../../shared/expose.js";

function Stream() {
  const [text, setText] = createSignal("Streaming text fades in");
  onSettled(() => expose({ kindStream: { set: setText } }));
  return <StreamingText text={text()} caret />;
}

export const cases = {
  all: () => (
    <div class="flex max-w-md flex-col items-start gap-6 p-6">
      <Loader />
      <ThinkingIndicator />
      <TypingIndicator />
      <p class="text-sm leading-6">
        <Stream />
      </p>
    </div>
  ),
};
