import assert from "node:assert/strict";
import { test } from "node:test";
import { inlineCitationPrimitive } from "@kind-ui/agent-ui/core";

const sources = [
  { id: "a", title: "A", url: "https://www.a.com/x" },
  { id: "b", title: "B" },
  { id: "c", title: "C", url: "javascript:alert(1)" },
];

test("the marker reads the first host, else a title, and its name starts with that text", () => {
  const many = inlineCitationPrimitive({ sources }).get();
  assert.equal(many.label, "a.com +2");
  assert.equal(many.name, "a.com +2, Sources: 3");
  const titled = inlineCitationPrimitive({ sources: [sources[1]], label: "1" }).get();
  assert.equal(titled.name, "1, Source: B");
  assert.equal(titled.summary, "Source: B");
});

test("paging before a Carousel attaches does nothing and returns false", () => {
  const citation = inlineCitationPrimitive({ sources, defaultOpen: true });
  assert.equal(citation.api.next?.(), false);
  assert.equal(citation.get().page, 1);
  assert.equal(citation.api.pageText(citation.get()), "1 of 3");
});

test("citations sharing a paragraph keep their entries across each other's updates", () => {
  const first = inlineCitationPrimitive({ sources });
  const second = inlineCitationPrimitive({ sources: [sources[1]] });
  const entries = first.get().entries;
  second.setOptions({ sources: [sources[1], sources[2]] });
  first.setOptions({ sources });
  assert.equal(first.get().entries, entries);
  first.setOptions({ sources: [...sources] });
  assert.equal(first.get().entries.a, entries.a);
});
