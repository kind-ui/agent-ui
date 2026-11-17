import assert from "node:assert/strict";
import { test } from "node:test";
import { addMenuPrimitive, addMenuSections } from "@kind-ui/agent-ui/core";

const items = [
  { id: "upload", label: "Upload file", description: "From your computer" },
  { id: "github", label: "GitHub", group: "Plugins", items: [{ id: "issue", label: "Add an issue" }] },
  { id: "context", label: "Add context" },
  { id: "off", label: "Off", group: "Plugins", disabled: true },
];

test("sections keep groups in first-seen order and group each submenu the same way", () => {
  const sections = addMenuSections(items, true);
  assert.deepEqual(
    sections.map(({ label, rows }) => [label ?? null, rows.map((row) => row.id)]),
    [
      [null, ["upload", "context"]],
      ["Plugins", ["github", "off"]],
    ],
  );
  assert.deepEqual(
    sections[1].rows[0].sections?.[0].rows.map((row) => row.id),
    ["issue"],
  );
  assert.equal(sections[1].rows[1].disabled, true);
});

test("without onAction every item is disabled, but a submenu still opens", () => {
  const [first, plugins] = addMenuSections(items, false);
  assert.equal(first.rows[0].disabled, true);
  assert.equal(plugins.rows[0].disabled, false);
  assert.equal(plugins.rows[0].sections?.[0].rows[0].disabled, true);
});

const menu = (options) => {
  const calls = [];
  const instance = addMenuPrimitive({
    items,
    defaultOpen: true,
    onAction: (id, details) => {
      calls.push([id, details.reason]);
      if (id === "context") details.cancel();
    },
    ...options,
  });
  return { instance, calls };
};

test("run runs a reachable leaf, refusing unknown, disabled and submenu ids, and leaves the menu open", () => {
  const { instance, calls } = menu();
  assert.equal(instance.api.run("issue"), true);
  assert.equal(instance.api.run("unknown"), false);
  assert.equal(instance.api.run("off"), false);
  assert.equal(instance.api.run("github"), false);
  assert.equal(instance.api.run("context"), false);
  assert.deepEqual(calls, [
    ["issue", "imperative"],
    ["context", "imperative"],
  ]);
  assert.equal(instance.get().open, true);
  assert.equal(menu({ onAction: undefined }).instance.api.run, undefined);
});

test("an item the owner cancels keeps the menu open; any other closes it", () => {
  const { instance } = menu();
  const { onAction, onOpenChange } = instance.api.partState.menu(instance.get());
  const close = () => {
    let canceled = false;
    onOpenChange(false, { reason: "item-press", source: "mouse", cancel: () => (canceled = true) });
    return canceled;
  };
  onAction("context", { event: new Event("click") });
  assert.equal(close(), true);
  assert.equal(instance.get().open, true);
  onAction("upload", { event: new Event("click") });
  assert.equal(close(), false);
  assert.equal(instance.get().open, false);
});

test("two menus updating in turn keep their items, and notify nothing, when their options don't change", () => {
  const other = [{ id: "a", label: "A" }];
  const onAction = () => {};
  const one = addMenuPrimitive({ items, onAction });
  const two = addMenuPrimitive({ items: other, onAction });
  const before = one.get().items;
  let notified = 0;
  one.subscribe(() => notified++);
  for (let i = 0; i < 3; i++) {
    one.setOptions({ items, onAction });
    two.setOptions({ items: other, onAction });
  }
  assert.equal(one.get().items, before);
  assert.equal(notified, 0);
});
