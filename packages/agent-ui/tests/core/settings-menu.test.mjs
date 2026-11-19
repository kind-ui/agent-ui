import assert from "node:assert/strict";
import { test } from "node:test";
import { settingsMenuPrimitive, settingsMenuRows } from "@kind-ui/agent-ui/core";

const settings = [
  { type: "toggle", id: "search", label: "Web search", description: "Look things up" },
  {
    type: "choice",
    id: "style",
    label: "Response style",
    options: [
      { value: "concise", label: "Concise" },
      { value: "detailed", label: "Detailed" },
    ],
  },
];

test("rows read each setting's value: a toggle without one is off, a choice with an unknown one shows none", () => {
  const [search, style] = settingsMenuRows(settings, { search: true, style: "verbose" });
  assert.equal(search.checked, true);
  assert.equal(style.value, undefined);
  assert.equal(settingsMenuRows(settings, {})[0].checked, false);
  assert.equal(settingsMenuRows(settings, { style: "detailed" })[1].value, "detailed");
});

const menu = (options) => {
  const calls = [];
  const instance = settingsMenuPrimitive({
    settings,
    onValuesChange: (values, details) => {
      calls.push([details.id, values[details.id], details.reason]);
      if (values[details.id] === "detailed") details.cancel();
    },
    ...options,
  });
  return { instance, calls };
};

test("toggle and setValue change one setting each, refusing unknown ids and values and what the owner cancels", () => {
  const { instance, calls } = menu();
  assert.equal(instance.api.toggle("search"), true);
  assert.equal(instance.api.toggle("search", true), true);
  assert.equal(instance.api.toggle("style"), false);
  assert.equal(instance.api.setValue("style", "concise"), true);
  assert.equal(instance.api.setValue("style", "verbose"), false);
  assert.equal(instance.api.setValue("search", "concise"), false);
  assert.equal(instance.api.setValue("style", "detailed"), false);
  assert.deepEqual(instance.get().values, { search: true, style: "concise" });
  assert.deepEqual(calls, [
    ["search", true, "imperative"],
    ["style", "concise", "imperative"],
    ["style", "detailed", "imperative"],
  ]);
});

test("a person's change the owner cancels is cancelled in the menu, and one it takes isn't", () => {
  const { instance } = menu({ values: { style: "concise" } });
  const { onCheckedChange, onValueChange } = instance.api.partState.menu(instance.get());
  const cancelled = (call) => {
    let cancel = false;
    call(() => (cancel = true));
    return cancel;
  };
  assert.equal(
    cancelled((cancel) =>
      onValueChange("detailed", { group: "style", reason: "item-press", source: "mouse", cancel }),
    ),
    true,
  );
  assert.equal(
    cancelled((cancel) =>
      onCheckedChange(true, { value: "search", reason: "item-press", source: "keyboard", cancel }),
    ),
    false,
  );
  // Controlled: the owner hasn't passed the new values yet.
  assert.deepEqual(instance.get().values, { style: "concise" });
});

test("toggle and setValue are offered only while enabled and holding a setting of their type", () => {
  assert.equal(menu({ disabled: true }).instance.api.toggle, undefined);
  const toggles = menu({ settings: [settings[0]] }).instance.api;
  assert.equal(typeof toggles.toggle, "function");
  assert.equal(toggles.setValue, undefined);
});

test("setValues changes each setting once, each change building on the last, while values are controlled", () => {
  const { instance, calls } = menu({ values: {} });
  assert.equal(instance.api.setValues({ search: true, style: "concise", unknown: true }), false);
  assert.deepEqual(calls, [
    ["search", true, "imperative"],
    ["style", "concise", "imperative"],
  ]);
  const seen = [];
  settingsMenuPrimitive({
    settings,
    values: {},
    onValuesChange: (values) => seen.push(values),
  }).api.setValues({
    search: true,
    style: "concise",
  });
  assert.deepEqual(seen.at(-1), { search: true, style: "concise" });
});

test("a setting named like an Object.prototype member reads only its own value", () => {
  const { instance } = menu({ settings: [{ type: "toggle", id: "constructor", label: "Odd" }] });
  assert.equal(settingsMenuRows(instance.get().entries, {})[0].checked, false);
  assert.equal(instance.api.toggle("constructor"), true);
  assert.deepEqual(instance.get().values, { constructor: true });
  assert.equal(instance.api.setValues({ toString: true }), false);
});
