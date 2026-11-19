import { expect, type Locator, type Page, test } from "@playwright/test";
import { addTestingKit } from "../ui-sdk-testing.js";

// UI SDK's `checkPattern` over every component with a WAI-ARIA pattern, on its fixture page, and `checkDirection`
// over the primitives that move focus with Left and Right themselves. Both drive the keyboard and read focus, so
// they need a real DOM; `checkServer` runs under `node --test` in `tests/core/ui-sdk-testing.test.mjs`. A problem a
// check accepts (`known`) names its entry in `.agents/experts/core/decisions.md`, unless it names another file.

type Pattern =
  | "disclosure"
  | "dialog"
  | "alertdialog"
  | "menu"
  | "combobox"
  | "listbox"
  | "toolbar"
  | "tree"
  | "radio-group"
  | "checkbox";

type Check = {
  name: string;
  page: string;
  pattern: Pattern;
  /** The widget, or its popup's trigger. */
  target: (page: Page) => Locator;
  /** Opens a popup before its check. */
  open?: (page: Page) => Promise<void>;
  /** Checks right to left too: the pattern's horizontal arrows swap. */
  rtl?: boolean;
  /** Problems an expert's `decisions.md` accepts; every other one fails. */
  known?: RegExp[];
};

type Kit = {
  checkPattern: (root: Element, pattern: Pattern) => Promise<void>;
  checkDirection: (primitive: unknown, options: unknown, markup: string) => Promise<void>;
  [primitive: string]: unknown;
};

// React's Radio group and Segmented Control keep a hidden native radio per item for forms, `aria-hidden`, which
// `checkPattern` counts as radios: see "checkPattern counts React's hidden form radios" in
// `.agents/experts/react/decisions.md`.
const hiddenRadios = [
  /has 2 checked radios/,
  /next radio, input, but focus went/,
  /previous radio,( wrapping around,)? input,/,
];

// A non-modal popover closes when Tab leaves it, so Escape after that has nothing to close: see "Non-modal popovers
// and checkPattern's dialog check".
const nonModal = [/focus should return here when Escape closes/];

const part = (page: Page, slot: string) => page.locator(`[data-slot="${slot}"]`).first();
const trigger = (page: Page, root: string) => part(page, root).locator('[data-step-part="trigger"]').first();
const press = (locator: (page: Page) => Locator) => (page: Page) => locator(page).click();
// The APG opens a menu button from the keyboard, focusing the menu's first item.
const enter = (locator: (page: Page) => Locator) => async (page: Page) => {
  await locator(page).focus();
  await page.keyboard.press("Enter");
};

const disclosures = [
  "step",
  "reasoning",
  "tool",
  "chain-of-thought",
  "task",
  "plan",
  "subagent",
  "terminal",
  "stack-trace",
  "test-results",
  "action",
].map(
  (name): Check => ({
    name,
    page: `${name}&case=${name === "step" ? "list" : "all"}`,
    pattern: "disclosure",
    target: (page) => trigger(page, `kind-${name}`),
  }),
);

const checks: Check[] = [
  ...disclosures,
  // Chain of Thought's steps are disclosures of their own, beside its summary.
  {
    name: "chain-of-thought steps",
    page: "chain-of-thought&case=all",
    pattern: "disclosure",
    target: (page) => part(page, "kind-chain-of-thought"),
  },
  {
    name: "sources",
    page: "sources&case=all",
    pattern: "disclosure",
    target: (page) => part(page, "kind-sources"),
  },
  {
    name: "queue",
    page: "queue&case=all",
    pattern: "disclosure",
    target: (page) => part(page, "kind-queue"),
  },
  {
    name: "guardrail-notice",
    page: "guardrail-notice&case=all",
    pattern: "disclosure",
    target: (page) => page.locator('[data-slot="kind-guardrail-notice"]:has([aria-expanded])').first(),
  },
  {
    name: "document",
    page: "document&case=all",
    pattern: "disclosure",
    target: (page) => page.locator('[data-slot="kind-document"]:has([aria-expanded])').first(),
  },
  {
    name: "checkpoint",
    page: "checkpoint&case=all",
    pattern: "alertdialog",
    target: (page) => page.locator("#checkpoint").getByRole("button", { name: "Restore checkpoint" }),
    open: press((page) => page.locator("#checkpoint").getByRole("button", { name: "Restore checkpoint" })),
  },
  // Context Meter's details and Inline Citation's card are non-modal and leave focus on their trigger, which
  // `checkPattern`'s dialog check (the modal one) refuses: see "Non-modal popovers and checkPattern's dialog check".
  {
    name: "context-meter",
    page: "context-meter&case=all",
    pattern: "disclosure",
    target: (page) => part(page, "kind-context-meter-trigger"),
  },
  {
    name: "feedback",
    page: "feedback&case=all",
    pattern: "dialog",
    target: (page) => page.getByRole("button", { name: "Add a comment" }),
    open: async (page) => {
      await page.getByRole("button", { name: "Good response" }).click();
      await page.getByRole("button", { name: "Add a comment" }).click();
    },
    known: nonModal,
  },
  {
    name: "generated-image",
    page: "generated-image&case=all",
    pattern: "dialog",
    target: (page) => page.locator("#loaded").getByRole("button", { name: "View full size" }),
    open: press((page) => page.locator("#loaded").getByRole("button", { name: "View full size" })),
  },
  {
    name: "inline-citation",
    page: "inline-citation&case=all",
    pattern: "disclosure",
    target: (page) => part(page, "kind-inline-citation-trigger"),
  },
  {
    name: "context-bar",
    page: "context-bar&case=all",
    pattern: "dialog",
    target: (page) => page.locator('[data-context-bar-part="overflow"]').first(),
    open: press((page) => page.locator('[data-context-bar-part="overflow"]').first()),
    known: nonModal,
  },
  {
    name: "question radios",
    page: "question&case=all",
    pattern: "radio-group",
    target: (page) => page.getByRole("radiogroup").first(),
    rtl: true,
    known: hiddenRadios,
  },
  {
    name: "question checkboxes",
    page: "question&case=all",
    pattern: "checkbox",
    target: (page) => page.getByRole("checkbox").first(),
  },
  {
    name: "reasoning-effort",
    page: "model-selector&case=all",
    pattern: "radio-group",
    target: (page) => page.getByRole("radiogroup", { name: "Reasoning effort" }),
    rtl: true,
    known: hiddenRadios,
  },
  {
    name: "test-results tree",
    page: "test-results&case=all",
    pattern: "tree",
    target: (page) => part(page, "kind-test-results").getByRole("tree"),
    rtl: true,
    // A failed test's row holds its Stack Trace: see "Test Results' failures sit inside its tree".
    known: [/^button.* is a button inside a tree/, /^\S+\[role=tree\]: has \d+ tab stops/],
  },
  {
    name: "file-tree",
    page: "file-tree&case=all",
    pattern: "tree",
    target: (page) => page.getByRole("tree").first(),
    rtl: true,
  },
  {
    name: "message",
    page: "message&case=all",
    pattern: "toolbar",
    target: (page) => page.getByRole("toolbar").first(),
    rtl: true,
  },
  {
    name: "message regenerate menu",
    page: "message&case=options",
    pattern: "menu",
    target: (page) => page.locator('[aria-haspopup="menu"]').first(),
    open: enter((page) => page.locator('[aria-haspopup="menu"]').first()),
    rtl: true,
  },
  ...["add-menu", "settings-menu", "approval-mode", "model-control"].map(
    (name): Check => ({
      name,
      page: `${name}&case=all`,
      pattern: "menu",
      target: (p) => part(p, `kind-${name}`).locator('[aria-haspopup="menu"]').first(),
      open: enter((p) => part(p, `kind-${name}`).locator('[aria-haspopup="menu"]').first()),
      rtl: true,
    }),
  ),
  ...["model-selector", "picker"].map(
    (name): Check => ({
      name,
      page: `${name}&case=all`,
      pattern: "combobox",
      target: (p) => p.getByRole("combobox").first(),
      open: press((p) => part(p, `kind-${name}-trigger`)),
      // Escape closes the whole picker: see "A picker's Escape closes its popover".
      known: [/Escape should close its popup/, /focus stays here when Escape closes the popup/],
    }),
  ),
  {
    name: "selection",
    page: "selection&case=all",
    pattern: "toolbar",
    target: (page) => page.getByRole("toolbar", { name: "Selection actions" }),
    open: async (page) => {
      await page.locator('#selection [data-slot="kind-selection-content"]').evaluate((content) => {
        const range = document.createRange();
        range.selectNodeContents(content);
        document.getSelection()?.removeAllRanges();
        document.getSelection()?.addRange(range);
        content.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift", bubbles: true }));
      });
    },
    rtl: true,
  },
];

const problemsOf = (target: Locator, pattern: Pattern) =>
  target.evaluate(async (el, pattern) => {
    try {
      await (window as unknown as { kindTesting: Kit }).kindTesting.checkPattern(el, pattern);
      return [];
    } catch (error) {
      const message = (error as Error).message;
      const listed = message.split("\n- ").slice(1);
      return listed.length ? listed : [message];
    }
  }, pattern);

for (const check of checks) {
  test(`${check.name} follows the ${check.pattern} pattern`, async ({ page }) => {
    for (const dir of check.rtl ? ["ltr", "rtl"] : ["ltr"]) {
      await page.goto(`/?c=${check.page}`);
      await page.evaluate((dir) => document.documentElement.setAttribute("dir", dir), dir);
      await addTestingKit(page);
      await check.open?.(page);
      await expect(check.target(page)).toBeVisible();
      const problems = await problemsOf(check.target(page), check.pattern);
      expect(
        problems.filter((problem) => !check.known?.some((known) => known.test(problem))),
        dir,
      ).toEqual([]);
    }
  });
}

const chips = [
  { id: "a", label: "notes.txt" },
  { id: "b", label: "plan.md" },
  { id: "c", label: "spec.md" },
];
const directions = [
  {
    name: "attachments",
    primitive: "attachmentsPrimitive",
    options: { items: chips.map(({ id, label }) => ({ id, name: label })) },
    markup: `<root>${chips.map(({ id, label }) => `<item value="${id}">${label}</item>`).join("")}</root>`,
  },
  {
    name: "context-bar",
    primitive: "contextBarPrimitive",
    options: { label: "Context", chips },
    markup: `<root><list>${chips.map(({ id, label }) => `<chip value="${id}">${label}</chip>`).join("")}</list></root>`,
  },
];

for (const { name, primitive, options, markup } of directions) {
  test(`${name} mirrors its arrows right to left`, async ({ page }) => {
    await page.goto("/?c=status&case=all");
    await addTestingKit(page);
    const problems = await page.evaluate(
      async ({ primitive, options, markup }) => {
        const kit = (window as unknown as { kindTesting: Kit }).kindTesting;
        try {
          await kit.checkDirection(kit[primitive], options, markup);
          return "";
        } catch (error) {
          return (error as Error).message;
        }
      },
      { primitive, options, markup },
    );
    expect(problems).toBe("");
  });
}
