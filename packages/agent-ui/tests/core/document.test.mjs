import assert from "node:assert/strict";
import { test } from "node:test";
import { documentPrimitive, documentSize } from "@kind-ui/agent-ui/core";

test("documentSize counts UTF-8 bytes", () => {
  assert.equal(documentSize(""), "0 bytes");
  assert.equal(documentSize("a"), "1 byte");
  assert.equal(documentSize("é"), "2 bytes");
  assert.equal(documentSize("€"), "3 bytes");
  assert.equal(documentSize("😀"), "4 bytes");
  assert.equal(documentSize("\ud800"), "3 bytes");
  assert.equal(documentSize("a".repeat(2450)), "2.5 kB");
  assert.equal(documentSize("a".repeat(999_949)), "999.9 kB");
  assert.equal(documentSize("a".repeat(999_950)), "1 MB");
});

const downloads = [
  { id: "md", label: "Markdown" },
  { id: "txt", label: "Text" },
];

test("download takes one request at a time, for a format in downloads, the first by default", async () => {
  const calls = [];
  let finish;
  const document = documentPrimitive({
    downloads,
    onDownload: (id) => {
      calls.push(id);
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  document.api.download?.("pdf");
  assert.deepEqual(calls, []);
  document.api.download?.();
  assert.equal(document.get().pending, true);
  assert.equal(document.api.download, undefined);
  finish();
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(document.get().pending, false);
  document.api.download?.("txt");
  assert.deepEqual(calls, ["md", "txt"]);
});

test("download passes undefined without downloads", () => {
  const calls = [];
  documentPrimitive({ onDownload: (id) => void calls.push(id) }).api.download?.();
  assert.deepEqual(calls, [undefined]);
});

test("a controlled open keeps the owner's value", () => {
  const document = documentPrimitive({ open: false, onOpenChange: () => {} });
  assert.equal(document.api.setOpen(true), true);
  assert.equal(document.get().open, false);
});
