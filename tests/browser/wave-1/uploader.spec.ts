import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";
import { addBack, travel, watchExit } from "../leaving.js";

type Calls = { files: string[]; rejected: string[]; cancels: string[]; retries: string[] };
type Fixture = {
  kindUploader: {
    calls: Calls;
    setStatus(id: string, status: string, progress?: number): void;
    remove(id: string): void;
  };
};

const open = async (page: Page, name = "mixed", motion?: string) => {
  await page.goto(`/?c=uploader&case=${name}${motion ? `&motion=${motion}` : ""}`);
  await expect(page.getByRole("group", { name: "Uploads" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(4);
};
const calls = (page: Page) => page.evaluate(() => (window as unknown as Fixture).kindUploader.calls);
const setStatus = (page: Page, id: string, status: string, progress?: number) =>
  page.evaluate(
    ([i, s, p]) =>
      (window as unknown as Fixture).kindUploader.setStatus(i as string, s as string, p as number),
    [id, status, progress] as const,
  );
// WebKit, like Safari, doesn't focus a button on click, so there it presses the focused button with Enter.
const activate = async (button: Locator, browserName: string) => {
  if (browserName !== "webkit") return button.click();
  await button.focus();
  await button.press("Enter");
};
const announced = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[aria-live]")].map((el) => el.textContent ?? "").join("|"),
  );

test("progress is exposed through aria-valuenow", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("progressbar", { name: "quarterly-report.pdf" })).toHaveAttribute(
    "aria-valuenow",
    "42",
  );
  await setStatus(page, "report", "uploading", 80);
  await expect(page.getByRole("progressbar", { name: "quarterly-report.pdf" })).toHaveAttribute(
    "aria-valuenow",
    "80",
  );
});

test("Cancel calls onCancel with the item's id, and focus moves to a neighbor", async ({
  page,
  browserName,
}) => {
  await open(page);
  await activate(page.getByRole("button", { name: "Cancel quarterly-report.pdf" }), browserName);
  expect((await calls(page)).cancels).toEqual(["report"]);
  await expect(page.getByRole("button", { name: "Cancel quarterly-report.pdf" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel meeting-notes.md" })).toBeFocused();
});

test("Retry shows only on failed items, and keeps focus as it turns into Cancel", async ({
  page,
  browserName,
}) => {
  await open(page);
  await expect(page.getByRole("button", { name: /^Retry/ })).toHaveCount(1);
  await activate(page.getByRole("button", { name: "Retry training-set.csv" }), browserName);
  expect((await calls(page)).retries).toEqual(["dataset"]);
  await expect(page.getByRole("button", { name: "Cancel training-set.csv" })).toBeFocused();
  await expect(page.getByRole("button", { name: /^Retry/ })).toHaveCount(0);
});

test("a double click on Retry retries once, without cancelling", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Retry training-set.csv" }).dblclick();
  expect(await calls(page)).toMatchObject({ retries: ["dataset"], cancels: [] });
});

test("announces uploads that finish or fail, once each", async ({ page }) => {
  await open(page);
  await setStatus(page, "report", "uploading", 90);
  expect(await announced(page)).not.toContain("quarterly-report.pdf");
  await setStatus(page, "report", "done", 100);
  await expect.poll(() => announced(page)).toContain("quarterly-report.pdf uploaded");
  await setStatus(page, "notes", "error");
  await expect.poll(() => announced(page)).toContain("meeting-notes.md failed");
});

test("dropped files reach onFiles, and files over maxSize reach onReject", async ({ page }) => {
  await open(page);
  await page.locator('[data-slot="file-input-dropzone"]').evaluate((el) => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "small.txt", { type: "text/plain" }));
    data.items.add(new File([new Uint8Array(6_000_000)], "huge.bin"));
    el.dispatchEvent(new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true }));
  });
  await expect.poll(() => calls(page)).toMatchObject({ files: ["small.txt"], rejected: ["huge.bin"] });
  await expect(page.getByRole("progressbar", { name: "small.txt" })).toBeVisible();
});

test("lists cancel and retry for agents while items can take them", async ({ page }) => {
  await open(page);
  await expectAgentActions(page, "Uploads", ["cancel", "retry"]);
  await setStatus(page, "dataset", "done", 100);
  await expectAgentActions(page, "Uploads", ["cancel"]);
});

const rows = {
  root: '[data-slot="kind-uploader-list"]',
  row: '[data-slot="kind-uploader-item"]',
  name: '[data-slot="progress-label"]',
  host: "kindUploader",
};
const openRows = async (page: Page, motion?: string) => {
  await open(page, "mixed", motion);
  await page.waitForFunction(() => document.getAnimations().length === 0);
};

test("a removed row leaves inert, then the rows after it slide into its place without a jump", async ({
  page,
}) => {
  await openRows(page);
  const { leaving, exit, paths } = await watchExit(page, { ...rows, id: "report" });
  expect(leaving).toEqual([{ inert: true, hidden: "true" }]);
  expect(exit).toContain("opacity");
  await expect(page.locator(rows.row)).toHaveCount(3);
  for (const name of ["meeting-notes.md", "team-offsite.jpg", "training-set.csv"]) {
    const { total, largestStep } = travel(paths[name] ?? []);
    expect(total).toBeGreaterThan(20);
    expect(largestStep).toBeLessThan(total / 2);
  }
  const { y } = (await page.locator(rows.row).first().boundingBox()) ?? { y: Number.NaN };
  expect(paths["meeting-notes.md"]?.at(-1)?.y).toBeCloseTo(y, 0);
});

test("under reduced motion a removed row only fades, and nothing after it slides", async ({ page }) => {
  await openRows(page, "reduced");
  const { leaving, exit, slid } = await watchExit(page, { ...rows, id: "report" });
  expect({ leaving, exit, slid }).toEqual({
    leaving: [{ inert: true, hidden: "true" }],
    exit: ["opacity"],
    slid: [],
  });
});

test('with motion="none" a removed row leaves at once', async ({ page }) => {
  await openRows(page, "none");
  const { leaving, slid } = await watchExit(page, { ...rows, id: "report" });
  expect({ leaving, slid }).toEqual({ leaving: [], slid: [] });
  await expect(page.locator(rows.row)).toHaveCount(3);
});

test("an item removed and added again under the same id plays its entrance", async ({ page }) => {
  await openRows(page);
  await watchExit(page, { ...rows, id: "report" });
  expect(await addBack(page, { ...rows, id: "report", text: "quarterly-report.pdf" })).toBe(true);
});

test("when the host removes the row whose Cancel is focused, focus moves to a neighbor's", async ({
  page,
}) => {
  await openRows(page);
  await page.getByRole("button", { name: "Cancel quarterly-report.pdf" }).focus();
  await page.evaluate(() => (window as unknown as Fixture).kindUploader.remove("report"));
  await expect(page.getByRole("button", { name: "Cancel meeting-notes.md" })).toBeFocused();
  await expect(page.locator(rows.row)).toHaveCount(3);
});

test("axe reports no violations", async ({ page }) => {
  await open(page);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  const { violations } = await new AxeBuilder({ page }).include("#root").analyze();
  expect(violations).toEqual([]);
});

test("React 19 sets kind-uploader's properties and hears its events", async ({ page }, testInfo) => {
  test.skip(layerOf(testInfo) !== "react", "React renders the web element");
  await open(page, "web-element");
  await page.getByRole("button", { name: "Retry training-set.csv" }).click();
  await page.getByRole("button", { name: "Cancel quarterly-report.pdf" }).click();
  expect(await calls(page)).toMatchObject({ retries: ["dataset"], cancels: ["report"] });
  await expect(page.getByRole("button", { name: "Cancel quarterly-report.pdf" })).toHaveCount(0);
});
