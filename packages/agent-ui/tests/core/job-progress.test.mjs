import assert from "node:assert/strict";
import test from "node:test";
import { jobProgressMeta, jobStage } from "@kind-ui/agent-ui/core";

test("jobStage reads the stage with its place", () => {
  assert.equal(jobStage("Installing dependencies", 2, 7), "3 of 7: Installing dependencies");
  assert.equal(jobStage(undefined, 2, 7), "3 of 7");
  assert.equal(jobStage("Installing", undefined, 7), "Installing");
  assert.equal(jobStage("", 9, 7), "7 of 7");
  assert.equal(jobStage(), "");
});

test("jobProgressMeta reads elapsed and remaining time while running, the duration once done", () => {
  assert.equal(
    jobProgressMeta("running", { elapsed: 120, etaSeconds: 60 }),
    "2 min elapsed, about 1 min left",
  );
  assert.equal(jobProgressMeta("running", { elapsed: null, etaSeconds: 72 }), "about 1 min 12 sec left");
  assert.equal(jobProgressMeta("running", { elapsed: 5, etaSeconds: 0 }), "5 sec elapsed");
  assert.equal(jobProgressMeta("complete", { elapsed: 5, durationSeconds: 190 }), "3 min 10 sec");
  assert.equal(jobProgressMeta("error", { elapsed: 5 }), "");
});
