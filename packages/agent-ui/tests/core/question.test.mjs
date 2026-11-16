import assert from "node:assert/strict";
import { test } from "node:test";
import { answerText, applyAnswer, missingAnswers, questionPrimitive } from "@kind-ui/agent-ui/core";

const env = {
  id: "env",
  prompt: "Where should it deploy?",
  kind: "single",
  required: true,
  options: [
    { value: "staging", label: "Staging" },
    { value: "prod", label: "Production" },
  ],
};
const checks = {
  id: "checks",
  prompt: "Which checks should run first?",
  kind: "multiple",
  options: [
    { value: "unit", label: "Unit tests" },
    { value: "e2e", label: "End-to-end tests" },
  ],
};
const notes = { id: "notes", prompt: "Anything else?", kind: "text", required: true };
const questions = [env, checks, notes];

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const tick = () => new Promise((resolve) => setTimeout(resolve));

const setup = (extra = {}) => {
  const calls = [];
  const replies = [];
  const answer = (action) => (answers, details) => {
    calls.push({ action, answers, details });
    const reply = deferred();
    replies.push(reply);
    return reply.promise;
  };
  const options = { questions, onSubmit: answer("submit"), onSkip: answer("skip"), ...extra };
  const question = questionPrimitive(options);
  return { question, calls, replies, set: (more) => question.setOptions({ ...options, ...more }) };
};

test("missingAnswers lists required questions with no value, no choices or blank text", () => {
  assert.deepEqual(missingAnswers(questions, {}), ["env", "notes"]);
  assert.deepEqual(missingAnswers(questions, { env: "prod", notes: "  " }), ["notes"]);
  assert.deepEqual(missingAnswers([{ ...checks, required: true }], { checks: [] }), ["checks"]);
  assert.deepEqual(missingAnswers(questions, { env: "prod", notes: "Ship it" }), []);
});

test("applyAnswer replaces a single choice, toggles a multiple one and ignores unknown options", () => {
  assert.deepEqual(applyAnswer(env, { env: "staging" }, "prod"), { env: "prod" });
  assert.deepEqual(applyAnswer(checks, {}, "unit"), { checks: ["unit"] });
  assert.deepEqual(applyAnswer(checks, { checks: ["unit", "e2e"] }, "unit"), { checks: ["e2e"] });
  const answers = { env: "prod" };
  assert.equal(applyAnswer(env, answers, "dev"), answers);
  assert.deepEqual(applyAnswer(notes, {}, "Hi"), { notes: "Hi" });
});

test("answerText reads options by label in their order, and trims text", () => {
  assert.equal(answerText(checks, ["e2e", "unit"]), "Unit tests, End-to-end tests");
  assert.equal(answerText(env, "prod"), "Production");
  assert.equal(answerText(notes, "  Ship it "), "Ship it");
  assert.equal(answerText(notes, " "), undefined);
});

test("submit is offered only once every required question has an answer", () => {
  const { question, calls } = setup();
  assert.equal(question.api.submit, undefined);
  assert.equal(question.api.select("env", "prod"), true);
  assert.equal(question.api.setText("notes", "Ship it"), true);
  assert.equal(typeof question.api.submit, "function");
  question.api.submit();
  assert.deepEqual(calls[0].answers, { env: "prod", notes: "Ship it" });
});

test("select and setText refuse unknown questions, options and the wrong kind", () => {
  const { question } = setup();
  assert.equal(question.api.select("region", "eu"), false);
  assert.equal(question.api.select("env", "dev"), false);
  assert.equal(question.api.select("notes", "prod"), false);
  assert.equal(question.api.setText("env", "prod"), false);
  assert.equal(question.api.select("checks", "unit"), true);
  assert.equal(question.api.select("checks", "e2e"), true);
  assert.equal(question.api.select("checks", "unit"), true);
  assert.deepEqual(question.get().value, { checks: ["e2e"] });
});

test("a second press while one is pending calls nothing, Skip included", () => {
  const { question, calls } = setup({ defaultValue: { env: "prod", notes: "Ship it" } });
  question.api.press("submit");
  question.api.press("skip");
  question.api.press("submit");
  assert.equal(calls.length, 1);
  assert.equal(question.get().pending, true);
  assert.equal(question.get().pressed, "submit");
  assert.equal(question.api.skip, undefined);
  assert.equal(question.api.select("env", "staging"), false);
});

test("a rejection unlocks the form, shows the error and keeps every answer", async () => {
  const { question, replies } = setup({ defaultValue: { env: "prod", notes: "Ship it" } });
  question.api.press("submit");
  replies[0].reject(new Error("offline"));
  await tick();
  assert.equal(question.get().pending, false);
  assert.equal(question.get().failed, true);
  assert.deepEqual(question.get().value, { env: "prod", notes: "Ship it" });
  assert.equal(typeof question.api.submit, "function");
});

test("a resolved submission stays locked until the host passes submitted", async () => {
  const { question, replies, set } = setup({ defaultValue: { env: "prod", notes: "Ship it" } });
  question.api.press("submit");
  replies[0].resolve();
  await tick();
  assert.equal(question.get().sent, true);
  assert.equal(question.api.submit, undefined);
  set({ submitted: { env: "prod", notes: "Ship it" } });
  assert.equal(question.get().sent, false);
  assert.equal(question.get().pressed, undefined);
  assert.deepEqual(question.api.summaryState(question.get()).items, [
    { id: "env", prompt: "Where should it deploy?", answer: "Production" },
    { id: "checks", prompt: "Which checks should run first?", answer: undefined },
    { id: "notes", prompt: "Anything else?", answer: "Ship it" },
  ]);
  assert.equal(question.api.summaryState(question.get()).outcome, "Answered");
});

test("a late result for replaced questions changes nothing", async () => {
  const { question, replies, set } = setup({ defaultValue: { env: "prod", notes: "Ship it" } });
  question.api.press("submit");
  set({ questions: [env] });
  replies[0].reject(new Error("late"));
  await tick();
  assert.equal(question.get().pending, false);
  assert.equal(question.get().failed, false);
});

test("a controlled value follows the host, and a person's change goes through onValueChange", () => {
  const changes = [];
  const { question, set } = setup({
    value: {},
    onValueChange: (value, details) => changes.push({ value, reason: details.reason }),
  });
  question.api.select("env", "prod");
  assert.deepEqual(changes, [{ value: { env: "prod" }, reason: "imperative" }]);
  assert.deepEqual(question.get().value, {});
  set({ value: { env: "staging" }, onValueChange: () => {} });
  assert.deepEqual(question.get().value, { env: "staging" });
});

test("value and defaultValue are mutually exclusive", () => {
  assert.throws(() => questionPrimitive({ questions, value: {}, defaultValue: {} }), TypeError);
});
