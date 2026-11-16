import assert from "node:assert/strict";
import { test } from "node:test";
import { nextFollowState } from "@kind-ui/agent-ui/core";

const away = { following: false, newCount: 0, count: 10 };

test("counts messages added while not following, clamping removals at zero", () => {
  const added = nextFollowState(away, { type: "count", count: 12 });
  assert.deepEqual(added, { following: false, newCount: 2, count: 12 });
  assert.deepEqual(nextFollowState(added, { type: "count", count: 9 }), {
    following: false,
    newCount: 0,
    count: 9,
  });
});

test("following resumes and resets the count", () => {
  const added = nextFollowState(away, { type: "count", count: 13 });
  assert.deepEqual(nextFollowState(added, { type: "following", following: true }), {
    following: true,
    newCount: 0,
    count: 13,
  });
});

test("messages added while following are not counted", () => {
  const following = { following: true, newCount: 0, count: 10 };
  assert.deepEqual(nextFollowState(following, { type: "count", count: 14 }), { ...following, count: 14 });
});

test("letting go keeps the count until more arrive", () => {
  const following = { following: true, newCount: 0, count: 10 };
  const released = nextFollowState(following, { type: "following", following: false });
  assert.deepEqual(released, { following: false, newCount: 0, count: 10 });
  assert.equal(nextFollowState(released, { type: "count", count: 11 }).newCount, 1);
});

test("older messages prepended above are never counted as new", () => {
  assert.deepEqual(nextFollowState(away, { type: "prepend", count: 15 }), { ...away, count: 15 });
});
