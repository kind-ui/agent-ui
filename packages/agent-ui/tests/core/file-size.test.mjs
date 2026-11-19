import assert from "node:assert/strict";
import { test } from "node:test";
import { attachmentDetail, uploadDetail } from "@kind-ui/agent-ui/core";

test("sizes under 1 kB read in bytes, with the plural", () => {
  assert.equal(attachmentDetail({ id: "a", name: "a.md", size: 1 }), "1 byte");
  assert.equal(attachmentDetail({ id: "b", name: "b.md", size: 812 }), "812 bytes");
  assert.equal(attachmentDetail({ id: "c", name: "c.pdf", size: 482_000 }), "482 kB");
});

test("a finished upload says so after its size", () => {
  const item = { id: "a", name: "a.jpg", size: 3_100_000, progress: 100 };
  assert.equal(uploadDetail({ ...item, status: "done" }), "3.1 MB · Uploaded");
  assert.equal(uploadDetail({ ...item, status: "uploading", size: 812, progress: 40 }), "40% · 812 bytes");
});
