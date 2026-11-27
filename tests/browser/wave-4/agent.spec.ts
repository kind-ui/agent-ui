import { expect, type Page, test } from "@playwright/test";
import {
  act,
  actionsOf,
  type Conformance,
  components,
  entry,
  expectSameAsPerson,
  host,
  setHost,
  settled,
  snapshot,
} from "../agent-conformance.js";
import { allowClipboard } from "../clipboard.js";
import { isWebElements } from "../layer.js";

const sources = { component: "kind-sources", label: "Used 3 sources", id: "sources" };
const citation = {
  component: "kind-inline-citation",
  label: "docs.github.com +2, Sources: 3",
  id: "citation",
};
const documentTarget = { component: "kind-document", label: "README.md", id: "document" };
const image = { component: "kind-generated-image", label: "A lighthouse at dusk", id: "image" };
const fileTree = { component: "kind-file-tree", label: "Files", id: "file-tree" };
const terminal = { component: "kind-terminal", label: "npm install", id: "terminal" };
const stackTrace = { component: "kind-stack-trace", label: "TypeError: x is undefined", id: "stack-trace" };
const testResults = { component: "kind-test-results", label: "Tests", id: "test-results" };
const transcript = { component: "kind-transcript", label: "Transcript", id: "transcript" };
const selection = { component: "kind-selection", label: "Selection actions", id: "selection" };
const action = { component: "kind-action", label: "Explain", id: "action" };

type Target = typeof sources;

const wave4 = [
  sources,
  citation,
  documentTarget,
  image,
  fileTree,
  terminal,
  stackTrace,
  testResults,
  transcript,
  selection,
  action,
];

const open = async (page: Page) => {
  await page.goto("/?c=agent&case=wave-4");
  await expect.poll(() => components(page)).toContain("kind-action");
  // The image offers `open` once it has loaded.
  await expect.poll(() => actionsOf(page, image.component, image.label)).toContain("open");
  await settled(page);
};
const byId = (id: string) => (page: Page) => page.locator(`[id="${id}"]`);
const part = (id: string, slot: string) => (page: Page) =>
  byId(id)(page).locator(`[data-slot="kind-${slot}"]`).first();
const click = (id: string, slot: string) => (page: Page) => part(id, slot)(page).click();
const button = (id: string, name: string) => (page: Page) =>
  byId(id)(page).getByRole("button", { name, exact: true }).click();
// The keyboard, where a pointer would leave the scroll area under it hovered.
const pressKey = (id: string, name: string) => async (page: Page) => {
  await byId(id)(page).getByRole("button", { name, exact: true }).focus();
  await page.keyboard.press("Enter");
};
const treeRow = (id: string, name: RegExp) => (page: Page) =>
  byId(id)(page).getByRole("treeitem", { name }).first().locator(':scope > [data-slot="tree-label"]');
// Arrow keys open and close a folder without selecting it, as a press would.
const toggleFolder = (name: RegExp, key: "ArrowRight" | "ArrowLeft") => async (page: Page) => {
  await byId("file-tree")(page).getByRole("treeitem", { name }).first().focus();
  await page.keyboard.press(key);
};

const opened = (target: Target) => (page: Page) =>
  expect.poll(async () => (await entry(page, target.component, target.label))?.open);

const openCard = async (page: Page) => {
  await click("citation", "inline-citation-trigger")(page);
  await opened(citation)(page).toBe(true);
  await settled(page);
};
const openImage = async (page: Page) => {
  await button("image", "View full size")(page);
  await opened(image)(page).toBe(true);
  await settled(page);
};
// A selection made with the keyboard, as a person extends one inside the content. The toolbar doesn't open again on
// the range it closed on, so each selection in one test ends elsewhere.
const selectText = async (page: Page, end = 10) => {
  await part("selection", "selection-content")(page).focus();
  await page.evaluate((offset) => {
    const text = document.querySelector("#selection-text")?.firstChild as Text;
    document.getSelection()?.setBaseAndExtent(text, 0, text, offset);
  }, end);
  await page.keyboard.press("Shift+ArrowRight");
  await opened(selection)(page).toBe(true);
  await settled(page);
};

// On web a hidden avatar fallback keeps the status it had when the favicon loaded, which depends on load order.
const favicon = '[data-slot="avatar-fallback"]';

const conformance: Conformance[] = [
  { target: sources, action: "expand", ignore: favicon, pointer: click("sources", "sources-trigger") },
  {
    target: sources,
    action: "collapse",
    ignore: favicon,
    before: click("sources", "sources-trigger"),
    pointer: click("sources", "sources-trigger"),
  },
  {
    target: citation,
    action: "open",
    ignore: favicon,
    pointer: click("citation", "inline-citation-trigger"),
  },
  {
    target: citation,
    action: "next",
    ignore: favicon,
    before: openCard,
    pointer: button("citation", "Next source"),
  },
  {
    target: citation,
    action: "previous",
    ignore: favicon,
    before: async (page) => {
      await openCard(page);
      await button("citation", "Next source")(page);
    },
    pointer: button("citation", "Previous source"),
  },
  {
    target: citation,
    action: "close",
    ignore: favicon,
    before: openCard,
    pointer: (page) => page.keyboard.press("Escape"),
  },
  { target: documentTarget, action: "copy", pointer: button("document", "Copy") },
  {
    target: documentTarget,
    action: "download",
    args: ["Text"],
    pointer: button("document", "Download Text"),
  },
  { target: documentTarget, action: "expand", pointer: pressKey("document", "Show more") },
  {
    target: documentTarget,
    action: "collapse",
    before: pressKey("document", "Show more"),
    pointer: pressKey("document", "Show less"),
  },
  { target: image, action: "open", pointer: button("image", "View full size") },
  {
    target: image,
    action: "close",
    before: openImage,
    pointer: (page) =>
      page.getByRole("dialog", { name: image.label }).getByRole("button", { name: "Close" }).click(),
  },
  {
    target: image,
    action: "download",
    pointer: async (page) => {
      await byId("image")(page).hover();
      await button("image", "Download")(page);
    },
  },
  {
    target: fileTree,
    action: "expand",
    args: ["src/routes"],
    pointer: toggleFolder(/^routes/, "ArrowRight"),
  },
  { target: fileTree, action: "collapse", args: ["src"], pointer: toggleFolder(/^src/, "ArrowLeft") },
  {
    target: fileTree,
    action: "select",
    args: ["README.md"],
    pointer: (page) => treeRow("file-tree", /^README\.md/)(page).click(),
  },
  { target: terminal, action: "expand", pointer: click("terminal", "terminal-trigger") },
  {
    target: terminal,
    action: "collapse",
    before: click("terminal", "terminal-trigger"),
    pointer: click("terminal", "terminal-trigger"),
  },
  {
    target: terminal,
    action: "copy",
    before: click("terminal", "terminal-trigger"),
    pointer: click("terminal", "terminal-copy"),
  },
  { target: stackTrace, action: "collapse", pointer: click("stack-trace", "stack-trace-trigger") },
  {
    target: stackTrace,
    action: "expand",
    before: click("stack-trace", "stack-trace-trigger"),
    pointer: click("stack-trace", "stack-trace-trigger"),
  },
  { target: stackTrace, action: "copy", pointer: click("stack-trace", "stack-trace-copy") },
  { target: stackTrace, action: "toggleLibraryFrames", pointer: click("stack-trace", "stack-trace-library") },
  {
    target: stackTrace,
    action: "openFrame",
    args: ["0"],
    pointer: click("stack-trace", "stack-trace-frame-open"),
  },
  {
    target: testResults,
    action: "setFilter",
    args: ["fail"],
    pointer: (page) =>
      byId("test-results")(page)
        .getByRole("button", { name: / failed$/ })
        .click(),
  },
  {
    target: testResults,
    action: "expand",
    args: ["cart"],
    pointer: (page) => treeRow("test-results", /^cart/)(page).click(),
  },
  {
    target: testResults,
    action: "collapse",
    args: ["auth"],
    pointer: (page) => treeRow("test-results", /^auth/)(page).click(),
  },
  { target: testResults, action: "collapse", pointer: click("test-results", "test-results-trigger") },
  {
    target: testResults,
    action: "expand",
    before: click("test-results", "test-results-trigger"),
    pointer: click("test-results", "test-results-trigger"),
  },
  {
    target: transcript,
    action: "search",
    args: ["review"],
    pointer: (page) => byId("transcript")(page).getByRole("searchbox").fill("review"),
  },
  {
    target: transcript,
    action: "seek",
    args: ["s3"],
    pointer: (page) => byId("transcript")(page).locator('[data-slot="kind-transcript-seek"]').nth(2).click(),
  },
  {
    target: selection,
    action: "run",
    args: ["ask"],
    before: selectText,
    pointer: button("selection", "Ask"),
  },
  {
    target: selection,
    action: "dismiss",
    before: selectText,
    pointer: (page) => page.keyboard.press("Escape"),
  },
  { target: action, action: "collapse", pointer: click("action", "action-trigger") },
  {
    target: action,
    action: "expand",
    before: click("action", "action-trigger"),
    pointer: click("action", "action-trigger"),
  },
];

test.beforeEach(({ context, browserName }) => allowClipboard(context, browserName));

test("one snapshot lists every Wave 1 to 3 component, each Wave 4 one by name with its actions, none asking for a person", async ({
  page,
}) => {
  await open(page);
  const entries = await snapshot(page);
  for (const component of [
    "kind-step",
    "kind-composer",
    "kind-uploader",
    "kind-queue",
    "kind-plan",
    "kind-subagent",
    "kind-confirmation",
    "kind-question",
    "kind-checkpoint",
    "kind-model-selector",
    "kind-feedback",
    "kind-guardrail-notice",
  ])
    expect(
      entries.some((item) => item.component === component),
      component,
    ).toBe(true);

  const listed = entries
    .filter((item) => wave4.some((target) => target.component === item.component))
    .map((item) => `${item.component} "${item.label}": ${[...item.actions].sort().join(" ")}`)
    .sort();
  expect(listed).toEqual([
    'kind-action "Explain": collapse expand press',
    'kind-document "README.md": copy download expand press',
    'kind-file-tree "Files": collapse expand select',
    'kind-generated-image "A lighthouse at dusk": download open press',
    'kind-inline-citation "docs.github.com +2, Sources: 3": open press',
    'kind-selection "Selection actions": ',
    'kind-sources "Used 3 sources": expand press',
    // The Stack Trace of the failed test inside Test Results.
    'kind-stack-trace "AssertionError: expected 401, got 200": collapse copy expand press toggleLibraryFrames',
    'kind-stack-trace "TypeError: x is undefined": collapse copy expand openFrame press toggleLibraryFrames',
    'kind-terminal "npm install": collapse copy expand press',
    'kind-test-results "Tests": collapse expand press setFilter',
    'kind-transcript "Transcript": search seek',
  ]);
  await selectText(page);
  expect(await actionsOf(page, selection.component, selection.label)).toEqual(["dismiss", "press", "run"]);
  for (const { id } of wave4) await expect(byId(id)(page).locator("[data-agent-confirm]")).toHaveCount(0);
});

for (const item of conformance) {
  const { target, action: name, args } = item;
  test(`${target.component} "${target.label}".${name}(${args?.join(", ") ?? ""}) leaves the page as a person's input does`, ({
    page,
  }) => {
    return expectSameAsPerson(page, open, item);
  });
}

const state = async (page: Page, { component, label }: Target, key: string) =>
  ((await entry(page, component, label)) as Record<string, unknown> | undefined)?.[key];

test("change callbacks hear source agent, and a cancelled change leaves the state alone", async ({
  page,
}) => {
  await open(page);
  await setHost(page, { refuse: true });
  await act(page, sources.component, sources.label, "expand");
  await act(page, citation.component, citation.label, "open");
  await act(page, documentTarget.component, documentTarget.label, "expand");
  await act(page, image.component, image.label, "open");
  await act(page, fileTree.component, fileTree.label, "expand", ["src/routes"]);
  await act(page, terminal.component, terminal.label, "expand");
  await act(page, stackTrace.component, stackTrace.label, "toggleLibraryFrames");
  await act(page, testResults.component, testResults.label, "setFilter", ["fail"]);
  await act(page, testResults.component, testResults.label, "expand", ["cart"]);
  await act(page, transcript.component, transcript.label, "search", ["review"]);
  await act(page, action.component, action.label, "collapse");
  expect((await host(page)).changes).toEqual(
    [
      "sources",
      "citation",
      "document",
      "image",
      "file-tree",
      "terminal",
      "stack-trace",
      "test-results",
      "test-results",
      "transcript",
      "action",
    ].map((name) => `${name}:agent`),
  );
  await settled(page);
  expect(await state(page, sources, "open")).toBe(false);
  expect(await state(page, citation, "open")).toBe(false);
  expect(await state(page, documentTarget, "open")).toBe(false);
  expect(await state(page, image, "open")).toBe(false);
  await expect(page.getByRole("dialog", { name: image.label })).toHaveCount(0);
  expect(await state(page, fileTree, "expanded")).toEqual(["src"]);
  expect(await state(page, terminal, "open")).toBe(false);
  expect(await state(page, stackTrace, "showLibraryFrames")).toBe(false);
  expect(await state(page, testResults, "filter")).toBe("all");
  expect(await state(page, testResults, "expanded")).toEqual(["auth", "auth/bad"]);
  expect(await state(page, transcript, "query")).toBe("");
  await expect(byId("transcript")(page).getByRole("searchbox")).toHaveValue("");
  expect(await state(page, action, "open")).toBe(true);
});

test("action callbacks hear source agent", async ({ page }) => {
  await open(page);
  await act(page, documentTarget.component, documentTarget.label, "copy");
  await act(page, documentTarget.component, documentTarget.label, "download", ["md"]);
  await act(page, image.component, image.label, "download");
  await act(page, fileTree.component, fileTree.label, "select", ["README.md"]);
  await act(page, terminal.component, terminal.label, "copy");
  await act(page, stackTrace.component, stackTrace.label, "copy");
  await act(page, stackTrace.component, stackTrace.label, "openFrame", ["3"]);
  await act(page, transcript.component, transcript.label, "seek", ["s3"]);
  await selectText(page);
  await act(page, selection.component, selection.label, "run", ["quote"]);
  await selectText(page, 20);
  await act(page, selection.component, selection.label, "dismiss");
  await expect
    .poll(async () => (await host(page)).sources)
    .toEqual(
      ["copy", "download", "download", "select", "copy", "copy", "openFrame", "seek", "run", "dismiss"].map(
        (name) => `${name}:agent`,
      ),
    );
});

type Steps = { ok: boolean; steps?: { result?: unknown }[] };
const refused = (result: Steps) => !result.ok || result.steps?.[0]?.result === false;

test("actions that take an id, a path or an index refuse an unknown one", async ({ page }) => {
  await open(page);
  await selectText(page);
  const results = [
    await act(page, selection.component, selection.label, "run", ["nope"]),
    await act(page, fileTree.component, fileTree.label, "expand", ["nope"]),
    await act(page, fileTree.component, fileTree.label, "collapse", ["nope"]),
    await act(page, fileTree.component, fileTree.label, "select", ["nope"]),
    await act(page, documentTarget.component, documentTarget.label, "download", ["nope"]),
    await act(page, stackTrace.component, stackTrace.label, "openFrame", ["99"]),
    await act(page, testResults.component, testResults.label, "setFilter", ["nope"]),
    await act(page, testResults.component, testResults.label, "expand", ["nope"]),
    await act(page, testResults.component, testResults.label, "collapse", ["nope"]),
    await act(page, transcript.component, transcript.label, "seek", ["nope"]),
  ];
  expect(results.map(refused)).toEqual(results.map(() => true));
  const { calls, changes } = await host(page);
  expect(calls).toEqual([]);
  expect(changes).toEqual([]);
});

test("can-* attributes offer their actions", async ({ page }, testInfo) => {
  test.skip(!isWebElements(testInfo), "web attributes only");
  await open(page);
  await selectText(page);
  const cases = [
    { target: documentTarget, attribute: "can-download", action: "download" },
    { target: image, attribute: "can-download", action: "download" },
    { target: fileTree, attribute: "can-select", action: "select" },
    { target: stackTrace, attribute: "can-open-frame", action: "openFrame" },
    { target: transcript, attribute: "can-seek", action: "seek" },
    { target: selection, attribute: "can-run", action: "run" },
  ];
  for (const { target, attribute, action: name } of cases) {
    const element = byId(target.id)(page);
    const actions = () => actionsOf(page, target.component, target.label);
    await element.evaluate((el, attr) => el.removeAttribute(attr), attribute);
    await expect.poll(actions, `#${target.id} without ${attribute}`).not.toContain(name);
    await element.evaluate((el, attr) => el.setAttribute(attr, ""), attribute);
    await expect.poll(actions, `#${target.id} with ${attribute}`).toContain(name);
  }
});
