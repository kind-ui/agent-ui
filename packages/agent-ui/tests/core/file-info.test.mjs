import assert from "node:assert/strict";
import { test } from "node:test";
import { attachmentDetail, attachmentsPrimitive, uploadDetail } from "@kind-ui/agent-ui/core";
import { checkServer } from "@ui-sdk/core/testing";

test("sizes under 1 kB read in bytes, with the plural", () => {
  assert.equal(attachmentDetail({ id: "a", name: "a.md", size: 1 }), "MD · 1 byte");
  assert.equal(attachmentDetail({ id: "b", name: "b.md", size: 812 }), "MD · 812 bytes");
  assert.equal(attachmentDetail({ id: "c", name: "c.pdf", size: 999.6 }), "PDF · 1 kB");
  assert.equal(attachmentDetail({ id: "d", name: "d.pdf", size: 1_500 }), "PDF · 1.5 kB");
});

test("a finished upload says so after its size", () => {
  const item = { id: "a", name: "a.jpg", size: 3_100_000, progress: 100 };
  assert.equal(uploadDetail({ ...item, status: "done" }), "3.1 MB · Uploaded");
  assert.equal(uploadDetail({ ...item, status: "uploading", size: 812, progress: 40 }), "40% · 812 bytes");
});

test("a file's kind comes from its media type, else its extension", () => {
  for (const [name, mediaType, kind] of [
    ["shot.bin", "image/png", "image"],
    ["heap.zip", undefined, "archive"],
    ["data.csv", "text/csv", "spreadsheet"],
    ["notes", "text/plain", "text"],
    ["blob", undefined, "file"],
  ]) {
    const html = checkServer(
      attachmentsPrimitive,
      { items: [{ id: "a", name, mediaType }] },
      '<root><item value="a"></item></root>',
    );
    assert.match(html, new RegExp(`data-file-kind="${kind}"`), name);
  }
});
