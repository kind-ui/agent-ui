import { appendFileSync } from "node:fs";
import { type Browser, expect, type Page, test } from "@playwright/test";
import { type ParityPage, parityPages } from "../../../packages/agent-ui/tests/fixtures/shared/parity.js";
import { layerHas, layerOf } from "../layer.js";

// A pointer or a touch never draws a focus ring, a text field never draws one at all, and the keyboard's ring shows
// on every other control (docs/design-principles.md). Every component's and wrapper's fixture pages are walked
// element by element, and the text fields once more under a host's global `:focus-visible` rule, which beats the
// layered component styles unless controls.css answers it.
// Each page is its own test, so CI's shards split the pages.
test.describe.configure({ mode: "parallel" });

const HOST_RULE = `:focus-visible:not(input, textarea), input:focus-visible, textarea:focus-visible
  { outline: 1px solid red; outline-offset: 3px; }`;

type Mode = "mouse" | "touch" | "keyboard" | "host";
type Offender = { mode: Mode; element: string; problem: string };
type Found = { key: string; element: string; text: boolean; rings: string[] };
type Probe = { mark(textOnly: boolean): number; rings(): string[]; focused(): Found | undefined };

const pages = new Map<string, { entry: ParityPage; names: string[] }>();
for (const [name, entries] of Object.entries(parityPages))
  for (const entry of entries) {
    const key = `${entry.c}&case=${entry.case}`;
    const page = pages.get(key) ?? { entry, names: [] };
    page.names.push(name);
    pages.set(key, page);
  }

// Runs in the page. Only elements inside a UI SDK or Kind part count: a fixture's own fields are the host's.
const defineProbe = () => {
  const FOCUSABLE =
    "a[href], button, input:not([type=hidden]), textarea, select, [tabindex], [contenteditable]:not([contenteditable=false])";
  const TEXT_INPUT = /^(?:text|search|email|url|tel|password|number)$/;
  const isText = (el: Element) =>
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && TEXT_INPUT.test(el.type)) ||
    (el as HTMLElement).isContentEditable;
  const label = (el: Element) => {
    const slot = el.closest("[data-slot]")?.getAttribute("data-slot");
    const role = el.getAttribute("role");
    const name = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 24);
    return `${el.localName}${role ? `[role=${role}]` : ""} in ${slot}${name ? ` "${name}"` : ""}`;
  };
  const finishTransitions = () => {
    for (const animation of document.getAnimations())
      if (animation instanceof CSSTransition) animation.finish();
  };
  // A ring is an outline anywhere, or a shadow on the focused element or a parent that leaves with focus.
  const shadows = (el: Element | null) => {
    const list: string[] = [];
    for (let node = el; node && node !== document.body; node = node.parentElement)
      list.push(getComputedStyle(node).boxShadow);
    return list;
  };
  const probe: Probe = {
    mark(textOnly) {
      const seen = new Map<string, number>();
      let index = 0;
      for (const el of document.querySelectorAll<HTMLElement>(FOCUSABLE)) {
        if (!el.closest("[data-slot]") || el.closest("[inert]") || el.matches(":disabled")) continue;
        if (!el.checkVisibility({ visibilityProperty: true }) || (textOnly && !isText(el))) continue;
        // Rows repeat: one of each kind of element is enough.
        const kind = `${el.localName}|${el.getAttribute("role")}|${el.closest("[data-slot]")?.getAttribute("data-slot")}`;
        const count = seen.get(kind) ?? 0;
        seen.set(kind, count + 1);
        if (count === 0) el.dataset.focusSweep = String(index++);
      }
      return index;
    },
    rings() {
      const found: string[] = [];
      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        // A transparent outline shows only in forced colors, as Tailwind's `outline-hidden`.
        const transparent = /^(?:transparent|rgba\(.*, 0\))$/.test(style.outlineColor);
        if (style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0 && !transparent)
          found.push(`outline ${style.outlineStyle} ${style.outlineWidth} on ${label(el)}`);
      }
      return found;
    },
    focused() {
      const active = document.activeElement;
      if (!active || active === document.body || !active.closest("[data-slot]")) return undefined;
      finishTransitions();
      const focusedRings = probe.rings();
      const focusedShadows = shadows(active);
      // A touch leaves the control `:active`, whose pressed shadow isn't focus.
      const pressed = active.matches(":active");
      (active as HTMLElement).blur();
      finishTransitions();
      const blurredRings = new Set(probe.rings());
      const blurredShadows = shadows(active);
      (active as HTMLElement).focus({ preventScroll: true });
      const rings = focusedRings.filter((ring) => !blurredRings.has(ring));
      if (!pressed)
        focusedShadows.forEach((shadow, index) => {
          if (shadow !== blurredShadows[index]) rings.push(`box-shadow ${shadow} at parent ${index}`);
        });
      const key = active.getAttribute("data-focus-key") ?? String(Math.random());
      active.setAttribute("data-focus-key", key);
      return { key, element: label(active), text: isText(active), rings };
    },
  };
  (window as unknown as { focusProbe: Probe }).focusProbe = probe;
  // A link's press keeps the page: its default runs after every listener, this one last.
  window.addEventListener("click", (event) => {
    if ((event.target as Element).closest?.("a[href]")) event.preventDefault();
  });
};

const call = <K extends keyof Probe>(page: Page, method: K, ...args: Parameters<Probe[K]>) =>
  page.evaluate(
    ([method, args]) =>
      // biome-ignore lint/suspicious/noExplicitAny: the probe's methods share one call path
      ((window as any).focusProbe[method] as (...a: unknown[]) => unknown)(...args),
    [method, args] as const,
  ) as Promise<ReturnType<Probe[K]>>;

async function open(browser: Browser, url: string, mode: Mode) {
  const touch = mode === "touch";
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    ...(touch ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : {}),
  });
  const page = await context.newPage();
  await page.addInitScript(defineProbe);
  await page.goto(url);
  if (mode === "host") await page.addStyleTag({ content: HOST_RULE });
  return { page, close: () => context.close() };
}

async function pointerSweep(page: Page, mode: Mode, offenders: Offender[]) {
  const count = await call(page, "mark", mode === "host");
  const { width, height } = page.viewportSize() ?? { width: 1280, height: 720 };
  for (let index = 0; index < count; index++) {
    const target = page.locator(`[data-focus-sweep="${index}"]`);
    const pressed = await (mode === "touch"
      ? target.tap({ timeout: 500 })
      : target.click({ timeout: 500 })
    ).then(
      () => true,
      () => false,
    );
    if (!pressed) continue;
    const found = await call(page, "focused");
    if (found?.rings.length)
      offenders.push({ mode, element: found.element, problem: found.rings.join("; ") });
    // A press somewhere empty closes what the press opened and keeps pointer modality.
    if (mode === "touch") await page.touchscreen.tap(width - 2, height - 2);
    else await page.mouse.click(width - 2, height - 2);
  }
}

async function keyboardSweep(page: Page, offenders: Offender[]) {
  const seen = new Set<string>();
  for (let step = 0; step < 40; step++) {
    await page.keyboard.press("Tab");
    const found = await call(page, "focused");
    if (!found) continue;
    if (seen.has(found.key)) break;
    seen.add(found.key);
    if (found.text && found.rings.length)
      offenders.push({ mode: "keyboard", element: found.element, problem: found.rings.join("; ") });
    if (!found.text && !found.rings.length)
      offenders.push({ mode: "keyboard", element: found.element, problem: "no keyboard ring" });
  }
}

for (const [key, { entry, names }] of pages)
  test(`focus rings on ?c=${key}`, async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name.endsWith("-strict"), "StrictMode renders the same styles");
    test.skip(!names.some((name) => layerHas(testInfo, name)), `${layerOf(testInfo)} doesn't render it yet`);
    const missing = entry.needs?.filter((need) => !layerHas(testInfo, need)) ?? [];
    test.skip(missing.length > 0, `${layerOf(testInfo)} doesn't render ${missing.join(", ")} yet`);
    test.setTimeout(120_000);
    const offenders: Offender[] = [];
    for (const mode of ["mouse", "touch", "keyboard", "host"] as const) {
      const { page, close } = await open(browser, `/?c=${key}`, mode);
      if (mode === "keyboard") await keyboardSweep(page, offenders);
      else await pointerSweep(page, mode, offenders);
      await close();
    }
    const unique = [...new Map(offenders.map((o) => [JSON.stringify(o), o])).values()];
    if (process.env.KIND_FOCUS_REPORT)
      appendFileSync(
        process.env.KIND_FOCUS_REPORT,
        unique.map((o) => `${JSON.stringify({ layer: layerOf(testInfo), page: key, ...o })}\n`).join(""),
      );
    expect(unique).toEqual([]);
  });
