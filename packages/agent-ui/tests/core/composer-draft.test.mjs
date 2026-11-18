import assert from "node:assert/strict";
import { test } from "node:test";
import { composerPrimitive, draftAfterSettle, isSubmittable } from "@kind-ui/agent-ui/core";

const d = (text, attachments = []) => ({ text, tokens: [], attachments });
const file = (error) => ({
  id: "f",
  file: {},
  name: "a.txt",
  size: 1,
  mediaType: "text/plain",
  ...(error ? { error } : {}),
});

test("whitespace-only draft is not submittable", () => assert.equal(isSubmittable(d("   ")), false));

test("a token or a valid attachment is submittable; an attachment with an error is not", () => {
  assert.equal(
    isSubmittable({
      text: "",
      tokens: [{ id: "t", kind: "mention", value: "a", label: "A" }],
      attachments: [],
    }),
    true,
  );
  assert.equal(isSubmittable(d("", [file()])), true);
  assert.equal(isSubmittable(d("", [file("size")])), false);
});

test("resolved clears an unchanged draft", () =>
  assert.deepEqual(draftAfterSettle(d("hi"), d("hi"), "resolved"), d("")));
test("resolved keeps newer edits", () =>
  assert.deepEqual(draftAfterSettle(d("hi there"), d("hi"), "resolved"), d("hi there")));
test("resolved keeps an attachment added meanwhile", () =>
  assert.deepEqual(draftAfterSettle(d("hi", [file()]), d("hi"), "resolved"), d("hi", [file()])));
test("rejected keeps the draft", () =>
  assert.deepEqual(draftAfterSettle(d("hi"), d("hi"), "rejected"), d("hi")));

test("value and defaultValue are mutually exclusive", () =>
  assert.throws(() => composerPrimitive({ value: d("a"), defaultValue: d("b") }), {
    name: "TypeError",
    message: "Composer: value and defaultValue are mutually exclusive",
  }));

test("submit snapshots the draft, locks until it settles, and ignores a settlement after destroy", async () => {
  const submitted = [];
  let settle;
  const composer = composerPrimitive({
    defaultValue: d("hi"),
    onSubmit: (draft) => {
      submitted.push(draft);
      return new Promise((resolve) => {
        settle = resolve;
      });
    },
  });
  composer.api.submit();
  composer.api.submit();
  assert.equal(submitted.length, 1);
  assert.equal(composer.get().pending, true);
  composer.destroy();
  settle();
  await Promise.resolve();
  assert.equal(composer.get().pending, true);
});

test("stop is offered only while pending with onStop", async () => {
  let settle;
  const composer = composerPrimitive({
    defaultValue: d("hi"),
    onSubmit: () => new Promise((resolve) => (settle = resolve)),
    onStop: () => {},
  });
  assert.equal(composer.api.stop, undefined);
  composer.api.submit();
  assert.equal(typeof composer.api.stop, "function");
  settle();
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(composer.api.stop, undefined);
  assert.deepEqual(composer.get().value, d(""));
});

test("appendText adds trimmed text after one space, reports dictation and its source, and refuses blank or disabled", () => {
  const changes = [];
  const composer = composerPrimitive({
    defaultValue: d("Hi  "),
    onValueChange: (value, details) => changes.push([value.text, details.reason, details.source]),
  });
  assert.equal(composer.api.appendText("  there ", "mouse"), true);
  assert.equal(composer.get().value.text, "Hi there");
  assert.equal(composer.api.appendText("next"), true);
  assert.deepEqual(changes, [
    ["Hi there", "dictation", "mouse"],
    ["Hi there next", "dictation", "programmatic"],
  ]);
  assert.equal(composer.api.appendText("   "), false);
  assert.equal(composerPrimitive({ disabled: true }).api.appendText("x"), false);
});
