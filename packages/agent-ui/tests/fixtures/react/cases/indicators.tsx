import { useEffect, useState } from "react";
import { Loader } from "../../../../src/react/loader.js";
import { StreamingText } from "../../../../src/react/streaming-text.js";
import { ThinkingIndicator } from "../../../../src/react/thinking-indicator.js";
import { TypingIndicator } from "../../../../src/react/typing-indicator.js";

function Stream() {
  const [text, setText] = useState("Streaming text fades in");
  useEffect(() => {
    Object.assign(window, { kindStream: { set: setText } });
  }, []);
  return <StreamingText text={text} caret />;
}

export const cases = {
  all: () => (
    <div className="flex max-w-md flex-col items-start gap-6 p-6">
      <Loader />
      <ThinkingIndicator />
      <TypingIndicator />
      <p className="text-sm leading-6">
        <Stream />
      </p>
    </div>
  ),
};
