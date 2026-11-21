import { createSignal, onSettled } from "solid-js";
import { StreamingText } from "@/components/ui/solid/streaming-text";

const reply =
  "The three timeouts all come from the same upstream call. Adding a retry with backoff should cover them.";
const words = reply.split(/(?<= )/);

export default function StreamingTextExample() {
  const [count, setCount] = createSignal(0);

  onSettled(() => {
    const timer = setInterval(() => setCount((count) => (count > words.length + 8 ? 0 : count + 1)), 120);
    return () => clearInterval(timer);
  });

  return (
    <p class="max-w-md">
      <StreamingText text={words.slice(0, count()).join("")} caret={count() < words.length} />
    </p>
  );
}
