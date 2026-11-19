import assert from "node:assert/strict";
import { test } from "node:test";
import { pickerPages, pickerPrimitive } from "@kind-ui/agent-ui/core";

const items = [
  { value: "a", label: "A", group: "Projects" },
  { value: "x", label: "X", group: "Other" },
  { value: "b", label: "B", group: "Projects" },
  {
    value: "branches",
    label: "Branches",
    group: "Other",
    items: [
      { value: "main", label: "main" },
      { value: "dev", label: "dev" },
    ],
  },
];
const actions = [
  { id: "new", label: "New" },
  { id: "open", label: "Open" },
];
const options = { chosen: "dev", check: true, backLabel: "Back" };

const outline = (page) =>
  page.sections.map(({ label, footer, rows }) => [
    label ?? null,
    footer,
    rows.map((row) => row.option.value),
  ]);

test("the first page keeps groups in first-seen order and puts every action last in one footer", () => {
  const [first] = pickerPages(items, actions, options);
  assert.equal(first.page, undefined);
  assert.deepEqual(outline(first), [
    ["Projects", false, ["i:a", "i:b"]],
    ["Other", false, ["i:x", "i:branches"]],
    [null, true, ["a:new", "a:open"]],
  ]);
  assert.equal(first.sections[1].rows[1].opens, true);
  assert.equal(first.sections[1].rows[1].option.page, "i:branches");
});

test("an item with items becomes a page whose footer is only the way back", () => {
  const pages = pickerPages(items, actions, options);
  assert.equal(pages.length, 2);
  assert.equal(pages[1].page, "i:branches");
  assert.deepEqual(outline(pages[1]), [
    [null, false, ["i:main", "i:dev"]],
    [null, true, ["b:i:branches"]],
  ]);
  assert.equal(pages[1].sections[1].rows[0].kind, "back");
  assert.equal(pages[1].sections[1].rows[0].label, "Back");
});

test("only the chosen leaf is checked while check is on; rows that open pages, actions and back are not", () => {
  const checked = (pages) =>
    pages.flatMap((page) =>
      page.sections.flatMap((section) =>
        section.rows.map((row) => [row.option.value, row.option["aria-checked"]]),
      ),
    );
  assert.deepEqual(checked(pickerPages(items, actions, options)), [
    ["i:a", "false"],
    ["i:b", "false"],
    ["i:x", "false"],
    ["i:branches", undefined],
    ["a:new", undefined],
    ["a:open", undefined],
    ["i:main", "false"],
    ["i:dev", "true"],
    ["b:i:branches", undefined],
  ]);
  const off = checked(pickerPages(items, actions, { ...options, check: false }));
  assert.ok(off.every(([, value]) => value === undefined));
});

const picker = (options) => {
  const calls = [];
  const record = (name) => (value, details) => calls.push([name, value, details.reason]);
  const instance = pickerPrimitive({
    items,
    actions,
    onValueChange: record("value"),
    onAction: record("action"),
    onOpenChange: record("open"),
    ...options,
  });
  return {
    instance,
    calls,
    run: (key) =>
      instance.api.commandState(instance.get()).props.onAction(key, { event: new Event("click") }),
  };
};

test("setValue chooses a leaf on any page and refuses unknown and disabled ones, leaving the list as it is", () => {
  const { instance, calls } = picker({
    defaultOpen: true,
    items: [...items, { value: "off", label: "Off", disabled: true }],
  });
  assert.equal(instance.api.setValue("main"), true);
  assert.equal(instance.api.setValue("unknown"), false);
  assert.equal(instance.api.setValue("off"), false);
  assert.equal(instance.api.setValue("branches"), false);
  assert.equal(instance.get().value, "main");
  assert.equal(instance.get().open, true);
  assert.deepEqual(calls, [["value", "main", "imperative"]]);
});

test("a disabled picker offers no setValue, run or open", () => {
  const { instance, calls } = picker({ disabled: true });
  assert.equal(instance.api.setValue, undefined);
  assert.equal(instance.api.run, undefined);
  assert.equal(instance.api.open, undefined);
  assert.deepEqual(calls, []);
});

test("a choice or action the owner refuses keeps the list open; an accepted one closes it", () => {
  const refused = picker({
    defaultOpen: true,
    onValueChange: (_, details) => details.cancel(),
    onAction: (_, details) => details.cancel(),
  });
  refused.run("i:a");
  refused.run("a:new");
  assert.equal(refused.instance.get().open, true);
  assert.equal(refused.instance.get().value, null);

  const accepted = picker({ defaultOpen: true });
  accepted.run("i:a");
  assert.deepEqual(accepted.calls, [
    ["value", "a", "item-press"],
    ["open", false, "item-press"],
  ]);
});

test("run is offered only with onAction, and an agent's run leaves the list open", () => {
  assert.equal(picker({ onAction: undefined }).instance.api.run, undefined);
  const { instance, calls } = picker({ defaultOpen: true });
  assert.equal(instance.api.run("new"), true);
  assert.equal(instance.api.run("missing"), false);
  assert.deepEqual(calls, [["action", "new", "imperative"]]);
  assert.equal(instance.get().open, true);
});
