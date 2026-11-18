import assert from "node:assert/strict";
import { test } from "node:test";
import { dictationButtonPrimitive } from "@kind-ui/agent-ui/core";

/** A source the test drives: `push` reports an event, and the iterator ends once `end` runs after an abort. */
const fakeSource = () => {
  const fake = { signal: undefined, queue: [], wake: () => {}, ended: false };
  fake.push = (event) => {
    fake.queue.push(event);
    fake.wake();
  };
  fake.end = () => {
    fake.ended = true;
    fake.wake();
  };
  fake.source = {
    async *start(signal) {
      fake.signal = signal;
      for (;;) {
        const next = fake.queue.shift();
        if (next) yield next;
        else if (fake.ended) return;
        else await new Promise((resolve) => (fake.wake = resolve));
      }
    },
  };
  return fake;
};

const tick = () => new Promise((resolve) => setTimeout(resolve));

const setup = () => {
  const fake = fakeSource();
  const texts = [];
  const instance = dictationButtonPrimitive({
    source: fake.source,
    onText: (text, details) => texts.push([text, details]),
  });
  return { fake, texts, instance };
};

test("Stop sends the final text once, after the source ends, and never the interim text", async () => {
  const { fake, texts, instance } = setup();
  instance.api.start();
  await tick();
  fake.push({ text: " Hello", final: true });
  fake.push({ text: "wor", final: false });
  await tick();
  assert.equal(instance.get().interim, "wor");
  instance.api.stop();
  assert.equal(instance.get().phase, "transcribing");
  assert.equal(fake.signal.aborted, true);
  fake.push({ text: " world", final: true });
  fake.end();
  await tick();
  assert.equal(instance.get().phase, "idle");
  assert.deepEqual(
    texts.map(([text, details]) => [text, details.reason]),
    [["Hello world", "imperative"]],
  );
  instance.destroy();
});

test("Cancel sends nothing, even once the source reports more", async () => {
  const { fake, texts, instance } = setup();
  instance.api.start();
  fake.push({ text: "Hello", final: true });
  await tick();
  instance.api.cancel();
  assert.equal(instance.get().phase, "idle");
  fake.push({ text: "late", final: true });
  fake.end();
  await tick();
  assert.deepEqual(texts, []);
  instance.destroy();
});

test("an error shows its words, sends nothing and offers start again", async () => {
  const { fake, texts, instance } = setup();
  instance.api.start();
  assert.equal(instance.api.start, undefined);
  fake.push({ error: "denied" });
  await tick();
  assert.equal(instance.get().phase, "error");
  assert.equal(instance.get().error, "Microphone blocked");
  assert.equal(typeof instance.api.start, "function");
  assert.deepEqual(texts, []);
  instance.destroy();
});

test("without a source, nothing is offered", () => {
  const instance = dictationButtonPrimitive({});
  assert.equal(instance.api.start, undefined);
  instance.destroy();
});
