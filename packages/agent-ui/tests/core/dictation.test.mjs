import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createSpeechDictation } from "@kind-ui/agent-ui/core";

const read = async (iterable, events = []) => {
  for await (const event of iterable) events.push(event);
  return events;
};

const globals = [
  "SpeechRecognition",
  "AudioContext",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "navigator",
];
const saved = Object.fromEntries(
  globals.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
);
afterEach(() => {
  for (const name of globals) {
    if (saved[name]) Object.defineProperty(globalThis, name, saved[name]);
    else delete globalThis[name];
  }
});

/** A fake microphone and recognizer. Stopping it reports the final text, as a browser does. */
const fakeSpeech = () => {
  const fake = {
    tracks: [{ stopped: false, stop: () => (fake.tracks[0].stopped = true) }],
    recognizer: undefined,
  };
  globalThis.SpeechRecognition = class {
    constructor() {
      fake.recognizer = this;
    }
    start() {
      this.started = true;
    }
    stop() {
      this.stopped = true;
      this.onresult({ resultIndex: 1, results: [{}, { isFinal: true, 0: { transcript: "hello world" } }] });
      this.onend();
    }
    abort() {}
  };
  globalThis.AudioContext = class {
    createAnalyser = () => ({ fftSize: 32, getByteTimeDomainData: () => {} });
    createMediaStreamSource = () => ({ connect: () => {} });
    close = async () => {};
  };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => fake.tracks }) } },
  });
  return fake;
};

test("createSpeechDictation reports unsupported without SpeechRecognition", async () => {
  const events = await read(createSpeechDictation().start(new AbortController().signal));
  assert.deepEqual(events, [{ error: "unsupported" }]);
});

test("createSpeechDictation turns results into text events and stops on abort", async () => {
  const fake = fakeSpeech();
  const controller = new AbortController();
  const events = [];
  const done = read(createSpeechDictation({ lang: "en-US" }).start(controller.signal), events);
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(fake.recognizer.lang, "en-US");
  assert.ok(fake.recognizer.started);
  fake.recognizer.onresult({ resultIndex: 0, results: [{ isFinal: false, 0: { transcript: "hello" } }] });
  controller.abort();
  await done;
  assert.deepEqual(events, [
    { text: "hello", final: false },
    { text: "hello world", final: true },
  ]);
  assert.ok(fake.recognizer.stopped);
  assert.ok(fake.tracks[0].stopped);
});

test("createSpeechDictation reports a refused microphone as denied", async () => {
  fakeSpeech();
  globalThis.navigator.mediaDevices.getUserMedia = async () => {
    throw Object.assign(new Error("refused"), { name: "NotAllowedError" });
  };
  const events = await read(createSpeechDictation().start(new AbortController().signal));
  assert.deepEqual(events, [{ error: "denied" }]);
});
