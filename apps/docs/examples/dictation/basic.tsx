"use client";
import type { DictationEvent, DictationSource } from "@kind-ui/agent-ui/core";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { Dictation } from "@/components/ui/dictation";

const words = "Add a retry with backoff to the fetch client".split(" ");
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays back a recording instead of opening the microphone, so the example runs without a speech service.
const demoSource: DictationSource = {
  async *start(signal): AsyncGenerator<DictationEvent> {
    let heard = 0;
    for (let tick = 0; !signal.aborted; tick++) {
      const speaking = heard < words.length;
      yield { level: speaking ? 0.25 + 0.6 * Math.abs(Math.sin(tick * 1.7)) : 0.05 };
      if (speaking && tick % 5 === 4) {
        heard++;
        yield { text: words.slice(0, heard).join(" "), final: false };
      }
      await wait(80);
    }
    if (heard === 0 || signal.reason === "cancel") return;
    await wait(600);
    yield { text: words.slice(0, heard).join(" "), final: true };
  },
};

export default function DictationExample() {
  return (
    <div className="w-full max-w-md">
      <Composer aria-label="Message">
        <ComposerInput aria-label="Prompt" placeholder="Type or dictate a prompt" />
        <Dictation source={demoSource} />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}
