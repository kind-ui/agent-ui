import { expect, test } from "@playwright/test";

test("a pending shared button keeps its width, and its label stays its name", async ({ page }) => {
  await page.goto("/?c=step&case=list");
  await expect(page.locator('[data-slot="kind-step"]').first()).toHaveAttribute("data-status", /.+/);
  await page.evaluate(() => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.innerHTML =
      '<button type="button" data-kind-button="primary">Restore checkpoint</button><button type="button" data-kind-button>Cancel</button>';
    document.body.append(row);
  });
  const button = page.getByRole("button", { name: "Restore checkpoint" });
  const neighbor = page.getByRole("button", { name: "Cancel" });
  const idle = await button.boundingBox();
  const idleNeighbor = await neighbor.boundingBox();

  await button.evaluate((el) => {
    el.setAttribute("data-pending", "");
    el.setAttribute("aria-busy", "true");
    el.insertAdjacentHTML(
      "beforeend",
      '<span data-status-mark data-status="running" aria-hidden="true"></span>',
    );
  });

  expect(await button.boundingBox()).toEqual(idle);
  expect(await neighbor.boundingBox()).toEqual(idleNeighbor);
  await expect(button).toHaveCSS("color", "rgba(0, 0, 0, 0)");
  const offCenter = await button.evaluate((el) => {
    const outer = el.getBoundingClientRect();
    const mark = (el.querySelector("[data-status-mark]") as Element).getBoundingClientRect();
    return Math.abs(mark.x + mark.width / 2 - (outer.x + outer.width / 2));
  });
  expect(offCenter).toBeLessThan(1);
});

test("under reduced motion, popups and dialogs only fade as they enter and leave", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?c=step&case=list");
  await expect(page.locator('[data-slot="kind-step"]').first()).toHaveAttribute("data-status", /.+/);
  const scales = await page.evaluate(() =>
    ["data-kind-popup", "data-kind-dialog"].flatMap((kind) =>
      ["data-starting-style", "data-ending-style"].map((state) => {
        const el = document.createElement("div");
        el.setAttribute(kind, "");
        el.setAttribute(state, "");
        document.body.append(el);
        const { scale, transitionProperty } = getComputedStyle(el);
        el.remove();
        return `${kind} ${state}: ${scale} ${transitionProperty}`;
      }),
    ),
  );
  expect(scales).toEqual([
    "data-kind-popup data-starting-style: none opacity",
    "data-kind-popup data-ending-style: none opacity",
    "data-kind-dialog data-starting-style: none opacity",
    "data-kind-dialog data-ending-style: none opacity",
  ]);
});
