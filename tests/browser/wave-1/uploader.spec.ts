import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { expectAgentActions } from "../agent-snapshot.js";
import { layerOf } from "../layer.js";

type Calls = { files: string[]; rejected: string[]; cancels: string[]; retries: string[] };
type Fixture = {
  kindUploader: { calls: Calls; setStatus(id: string, status: string, progress?: number): void };
};

const open = async (page: Page, name = "mixed") => {
  await page.goto(`/?c=uploader&case=${name}`);
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
