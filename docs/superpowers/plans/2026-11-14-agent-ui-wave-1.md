# `@kind-ui/agent-ui` Wave 1 (0.1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Before building any component, also read the installed UI SDK docs and the `ui-sdk` skill, as Task 1 sets up.

**Goal:** Stand up the kind-ui/agent-ui repository and ship Wave 1 of `@kind-ui/agent-ui`: neutral types, the AI SDK adapter, the Step base, Conversation, Message, streaming Markdown (with Code Block and Markdown Table), Composer, Attachments, Uploader, and the four indicators. Each ships in React and Web Components with registry items, docs pages, packed-package checks, CI, and release workflows.

**Architecture:** Every component is built on UI SDK.
- Behavior is one `definePrimitive` definition in `packages/agent-ui/src/core/<component>/`. It composes UI SDK components and `@ui-sdk/core` behaviors, and declares slot `role`/`focus`/`press`/`keys`.
- The React and Web Components render layers are `createParts` calls plus Tailwind classes. They are distributed only as copy-in registry items.
- The only code outside UI SDK is the spec §2 "Building on UI SDK" exception list.
- A lint guard enforces both rules, and a `createAgent` snapshot test per component proves each one is a live UI SDK primitive.

**Tech Stack:**
- **Tooling:** npm 11.9 workspaces, Node ≥22.12, TypeScript 5.9 (strict, NodeNext), Tailwind v4, Vite, Playwright + `@axe-core/playwright`, Biome, Changesets, `publint`, `@arethetypeswrong/cli`
- **UI SDK:** `@ui-sdk/core`, `@ui-sdk/react`, and `@ui-sdk/web`, all at one exact version, plus the `ui-sdk` skill
- **Runtime:** `motion`, `mdast-util-from-markdown` / `mdast-util-gfm` / `micromark-extension-gfm`, and `ai` (optional peer, types only)
- **Registry:** the `shadcn` CLI, pinned and run with `npx`

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`. Executors read the spec section each task cites, and always §2 "Building on UI SDK".

## Global Constraints

- **Build on UI SDK:** spec §2 "Building on UI SDK" applies to every task.
  - Each public and internal component is a `definePrimitive` definition or a ready-made UI SDK component.
  - Each render file uses `createParts` or wraps a UI SDK component.
  - Focus, keyboard navigation, popups, dismissal, selection, scroll following, announcements, and ARIA come from UI SDK.
  - Hand-written code is allowed only for that section's exception table. A new exception needs a spec change first.
- **Read the docs first:** before writing a primitive, read `node_modules/@ui-sdk/react/docs/llms.txt` (or `@ui-sdk/web`), the relevant parts of `docs/core.md` and `docs/rendering.md`, and the `ui-sdk` skill. Where this plan names a UI SDK API whose exact signature differs in the pinned version, follow the installed docs and record the difference in `AGENTS.md` "UI SDK API notes".
- **Package:** `@kind-ui/agent-ui` exports exactly `.`, `./core`, `./adapters/ai-sdk`, and `./styles.css` (spec §3), with no wildcard exports.
- **Dependencies:**
  - `@ui-sdk/core`, `motion`, `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm` are exact-pinned `dependencies`.
  - `ai` is an optional peer. There is no React peer.
  - `@ui-sdk/react` and `@ui-sdk/web` are dev dependencies at the same exact version as `@ui-sdk/core`.
- **Layer imports (spec §2):**
  - `types` imports nothing.
  - `core` never imports React, `ai`, or Tailwind.
  - `adapters/ai-sdk` imports only `types` and `ai` types.
  - Render layers import core only through `@kind-ui/agent-ui/core`.
- **TypeScript:** strict mode, NodeNext, explicit `.js` import suffixes, and named reexports only (no `export *`).
- **Naming:** primitive names are `kind-<component>`. Web Component tags are `kind-<component>` for the root and `kind-<component>-<part>` for parts. Web Components render into light DOM.
- **Styling:** Tailwind v4 utilities keyed on `data-*` attributes, with data-driven values passed through `--kind-*` CSS variables.
- **Accessibility:** every root requires an accessible name. UI SDK `announce` makes polite announcements, and only on terminal transitions.
- **Motion:** every animated primitive takes `motion: "auto" | "reduced" | "none"` (default `"auto"`).
  - `"reduced"`: no translate, scale, or height animation, and at most a 120 ms opacity fade.
  - `"none"`: the final state appears instantly.
- **Agent confirmation:** `composer.submit` carries `data-agent-confirm`. Hosts can turn it off with `agentConfirm: false`.
- **Registry item names:** `<component>`, `<component>-web`, and hidden `internal-<name>`.
- **Tests:** fixtures and explicitly resolved deferred promises only. No live services, no timing sleeps, and no model calls.
- **Publication:** the package stays `"private": true` at `0.0.0`. No task publishes.
- **Commits:** include `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.

## Review Focus

1. **Whitespace-only Composer submit:** Enter on `"   "` with no attachments does not call `onSubmit`. Test in Task 11.
2. **Markdown source replaced rather than appended** (regenerate, edit): the engine rebuilds instead of appending. Test in Task 7.
3. **Streaming Text shrinks or is replaced:** the new text renders without fading stale chunks. Test in Task 12.
4. **Messages removed while scrolled up:** the new-message count never goes negative and resets when following resumes. Test in Task 9.
5. **Adapter `output-available` with `output: null` or `undefined`:** the output stays present as `{ state: "available", value: null }` (or `undefined`). Test in Task 4.

---

## File Map

```text
package.json  package-lock.json  .nvmrc  .npmrc  .gitignore  biome.json  tsconfig.base.json
AGENTS.md  README.md  CONTRIBUTING.md  SECURITY.md  skills-lock / .agents/skills/ui-sdk/ (skill install output)
.changeset/{config.json,README.md,agent-ui-wave-1.md}
.github/workflows/{ci,version,release}.yml
playwright.config.mjs
packages/agent-ui/
  package.json  tsconfig.json  README.md  LICENSE
  src/index.ts
  src/types/{message,step,tool,records,guards,index}.ts
  src/adapters/ai-sdk/{index,parts,status,approval}.ts
  src/core/index.ts
  src/core/motion/        src/core/markdown/                 (exception modules)
  src/core/<component>/{<component>,index}.ts               (one definePrimitive each)
  src/internal/index.ts                                       (reexported UI SDK behaviors)
  src/react/<component>.tsx   src/react/internal/<name>.tsx   (createParts / UI SDK wrappers)
  src/web/<component>.ts      src/web/internal/<name>.ts
  src/styles/agent-ui.css
  tests/core/*.test.mjs
  tests/fixtures/{react,web}/  (Vite apps, ?c=<component>&case=<case>)
tests/browser/wave-1/*.spec.ts   tests/browser/agent-snapshot.ts
tests/types/{nodenext,bundler,no-ai,with-ai}/
registry/{catalog.mjs,README.md}
scripts/{run-checks,check-ui-sdk-usage,check-package,build-registry,check-registry-consumers,check-registry-namespace,pack-site}.mjs
scripts/ui-sdk-exceptions.json
scripts/tests/*.test.mjs
apps/docs/
```

---

### Task 1: Workspace, UI SDK install, and the UI SDK usage guard

**Files:**
- Create: root `package.json`, `.nvmrc` (`22`), `.npmrc` (`engine-strict=true`), `.gitignore` (`node_modules`, `dist`, `artifacts`, `test-results`), `biome.json`, `tsconfig.base.json`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.changeset/{config.json,README.md}`, `scripts/run-checks.mjs`
- Create: `packages/agent-ui/{package.json,tsconfig.json,README.md,LICENSE}`, `src/index.ts`, `src/core/index.ts`, `src/adapters/ai-sdk/index.ts`, `src/styles/agent-ui.css`
- Create: `scripts/check-ui-sdk-usage.mjs`, `scripts/ui-sdk-exceptions.json`
- Test: `scripts/tests/manifest.test.mjs`, `scripts/tests/ui-sdk-usage.test.mjs`, `scripts/tests/fixtures/ui-sdk-usage/**`

**Interfaces:**
- Produces: the root scripts from spec §2 "Root scripts". `lint` = `biome check . && node scripts/check-ui-sdk-usage.mjs`. Until a later task creates a stage's script file, `run-checks.mjs` skips that stage and prints `skipped: <stage>`.
- Produces: `packages/agent-ui/package.json` with:
  - `"name": "@kind-ui/agent-ui"`, `"version": "0.0.0"`, `"private": true`, `"type": "module"`
  - `"sideEffects": ["*.css"]`, `"files": ["dist", "README.md", "LICENSE"]`
  - exports `.` → `dist/index.js`, `./core` → `dist/core/index.js`, `./adapters/ai-sdk` → `dist/adapters/ai-sdk/index.js` (each with `types`), and `./styles.css` → `dist/styles/agent-ui.css`
- Produces: `checkUiSdkUsage(root: string, exceptions: Record<string, string>): string[]`, exported from `scripts/check-ui-sdk-usage.mjs`. The CLI prints its errors and exits 1 when there are any. Rules:
  1. **Core components:** every directory `src/core/<c>/`, except `motion` and `markdown`, contains `<c>.ts`. That file imports `definePrimitive` from `@ui-sdk/core`, calls it exactly once, and exports the result as `<camelCase(c)>Primitive`. Error: `src/core/<c>/<c>.ts: component must be defined with definePrimitive`.
  2. **Render files:** every `src/react/**/*.tsx` and `src/web/**/*.ts` imports `createParts` (from `@ui-sdk/react/primitive` or `@ui-sdk/web`) and calls it, or imports a component from `@ui-sdk/react/<name>` / `@ui-sdk/web/<name>`. Error: `<file>: render file must use createParts or wrap a UI SDK component`.
  3. **Render files must not contain** `addEventListener`, `onKeyDown`, `onKeyUp`, `tabIndex`, `tabindex`, `.focus(`, `scrollTo`, `scrollTop`, `role=`, `role:`, or `setAttribute("aria-`. Error: `<file>: <pattern> belongs in the primitive (UI SDK)`.
  4. **Core files must not contain** `addEventListener`, `.focus(`, `scrollTo`, `scrollTop`, `tabindex`, `setAttribute("role"`, or `setAttribute("aria-`. Files listed in `exceptions` are exempt.
  5. **Exceptions file:** each key in `ui-sdk-exceptions.json` is a file path and each value is the exact "Exception" cell from spec §2. A value not in the set of that table's rows is an error, and so is a key whose file doesn't exist.
- Produces: `AGENTS.md` sections:
  - **"Build on UI SDK":** quotes the spec rules and requires reading `node_modules/@ui-sdk/<framework>/docs/llms.txt`, `docs/core.md`, `docs/rendering.md`, and the `ui-sdk` skill before writing a component.
  - **"UI SDK API notes":** filled in by Task 2 and later tasks.
  - Root scripts, layer import rules, and links to the spec and this plan.

- [ ] **Step 1: Write the failing tests.**

```js
// manifest.test.mjs
test("package exports are exactly the four public entries", () =>
  assert.deepEqual(Object.keys(pkg.exports).sort(), [".", "./adapters/ai-sdk", "./core", "./styles.css"]));
test("runtime dependencies are pinned exactly", () => {
  for (const [n, r] of Object.entries(pkg.dependencies)) assert.match(r, /^\d+\.\d+\.\d+(-[\w.]+)?$/, n);
});
test("ui-sdk packages share one exact version", () => {
  assert.equal(pkg.devDependencies["@ui-sdk/react"], pkg.dependencies["@ui-sdk/core"]);
  assert.equal(pkg.devDependencies["@ui-sdk/web"], pkg.dependencies["@ui-sdk/core"]);
});
test("ai is an optional peer and react is not a peer", () => {
  assert.equal(pkg.peerDependenciesMeta.ai.optional, true);
  assert.equal(pkg.peerDependencies.react, undefined);
});

// ui-sdk-usage.test.mjs (fixture trees under scripts/tests/fixtures/ui-sdk-usage/)
test("core component without definePrimitive fails", () =>
  assert.match(checkUiSdkUsage(fx("no-define"), {}).join(), /src\/core\/widget\/widget.ts: component must be defined with definePrimitive/));
test("render file without createParts fails", () =>
  assert.match(checkUiSdkUsage(fx("no-parts"), {}).join(), /render file must use createParts/));
test("hand-written keydown in a render file fails", () =>
  assert.match(checkUiSdkUsage(fx("render-keydown"), {}).join(), /onKeyDown belongs in the primitive/));
test("unlisted exception fails", () =>
  assert.match(checkUiSdkUsage(fx("ok"), { "src/core/x.ts": "Not in spec" }).join(), /not a spec exception/));
test("conforming tree passes", () => assert.deepEqual(checkUiSdkUsage(fx("ok"), {}), []));
```

- [ ] **Step 2: Run** `node --test scripts/tests/`. Expected: FAIL (modules missing).
- [ ] **Step 3: Create the files and install.**
  - Run `npm install --save-exact` for `@ui-sdk/core` (the latest at execution time; it was `0.1.0-beta.1` at spec time), plus `@ui-sdk/react` and `@ui-sdk/web` at that exact version as dev dependencies.
  - Pin `ai` exactly as a dev dependency and set the peer to `^<major>.0.0`.
  - Root dev dependencies: `@biomejs/biome`, `@changesets/cli`, `typescript@5.9.3`, `@types/node@22`, `@playwright/test`, `@axe-core/playwright`, `vite`, `@tailwindcss/vite`, `tailwindcss@4`, `react@19`, `react-dom@19`, `@types/react`, `@types/react-dom`, `publint`, `@arethetypeswrong/cli`.
  - Run `npx skills add vercel-labs/ui --skill ui-sdk` and commit its output. If the CLI is unavailable, `AGENTS.md` points to `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md` instead.
  - Set `engines.node` to `>=22.12.0` and `packageManager` to `npm@11.9.0`. Changesets config: `baseBranch: "main"`, `access: "public"`.
  - Create `scripts/ui-sdk-exceptions.json` as `{}`; later tasks add their exception files.
- [ ] **Step 4: Run** `node --test scripts/tests/ && npm run lint && npm run build`. Expected: all pass, and `ls node_modules/@ui-sdk/react/docs/llms.txt node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md` finds both files.
- [ ] **Step 5: Commit** `chore: scaffold workspace on UI SDK with usage guard`.

---

### Task 2: Light-DOM + Tailwind gate (Composer shell, both render layers)

Spec §12: if this task fails in the Web Components project, stop. Report the failure and revise the spec before any other component task starts.

**UI SDK:** `definePrimitive` (slots `root`/`input`/`submit`, `submit` with `role: "button"` and `press`), `createParts` from `@ui-sdk/react/primitive` and `@ui-sdk/web`, and `createAgent` from `@ui-sdk/react/agent` and `@ui-sdk/web/agent`.

**Files:**
- Create: `packages/agent-ui/src/core/composer/{composer,index}.ts` (shell: `onSubmit` action and pending state only), `src/react/composer.tsx`, `src/web/composer.ts`
- Create: `packages/agent-ui/tests/fixtures/react/{index.html,main.tsx,vite.config.mjs,styles.css,cases/composer.tsx}`, `tests/fixtures/web/{index.html,main.ts,vite.config.mjs,styles.css,cases/composer.ts}`, `playwright.config.mjs`, `tests/browser/agent-snapshot.ts`
- Test: `tests/browser/wave-1/light-dom.spec.ts`

**Interfaces:**
- Produces: `composerPrimitive` (`name: "kind-composer"`) from `@kind-ui/agent-ui/core`.
- Produces: React `Composer`, `ComposerInput`, `ComposerSubmit`, and web `defineComposer(): void`, which idempotently registers `kind-composer`, `kind-composer-input`, and `kind-composer-submit`.
- Produces: fixture routing. `?c=<component>&case=<case>` renders `cases/<component>`. React serves on port 4310 and Web on 4311. The Playwright projects are `wave-1-react` and `wave-1-web` (Chromium, `webServer: vite --port <port> --strictPort`). Each fixture calls `createAgent()` once and exposes it as `window.agent`.
- Produces: `expectAgentActions(page, label: string, actions: string[]): Promise<void>` in `tests/browser/agent-snapshot.ts`. It finds the `window.agent.snapshot()` entry whose `label` equals `label`, and asserts its `actions` deep-equal `actions`, sorted. Every later component task uses it.
- Produces: `AGENTS.md` "UI SDK API notes", which records the verified `@ui-sdk/web` `createParts` signature and how it maps tag names.

- [ ] **Step 1: Write the failing test** (runs in both projects):

```ts
test("composer renders in light DOM with Tailwind utilities applied", async ({ page }) => {
  await page.goto("/?c=composer&case=shell");
  const form = page.getByRole("form", { name: "Message" });
  await expect(form).toBeVisible();
  expect(await page.evaluate(() => [...document.querySelectorAll("*")].some((el) => el.shadowRoot))).toBe(false);
  await expect(form).toHaveCSS("border-top-color", "rgb(1, 2, 3)"); // class border-[rgb(1,2,3)]
  await page.getByRole("textbox", { name: "Message" }).fill("hi");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(form).toHaveAttribute("data-pending", "");
  await expect(form).toHaveCSS("opacity", "0.5"); // class data-[pending]:opacity-50
});
test("composer is a live UI SDK primitive", async ({ page }) => {
  await page.goto("/?c=composer&case=shell");
  await expectAgentActions(page, "Message", ["setValue", "submit"]);
});
```

- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/light-dom.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Primitive: `onSubmit` has option kind `"action"`. `data-pending` is set while its promise is unsettled. Set `agent: { actions: ["setValue", "submit"] }` and `controlled: ["value"]`.
  - Render layers: `createParts(composerPrimitive, { root: "form", input: "textarea", submit: "button" })`. Task 11 replaces the textarea with the internal Token Input.
- [ ] **Step 4: Run** the same command plus `npm run lint`. Expected: PASS in `wave-1-react` and `wave-1-web`, and the guard passes. If `wave-1-web` fails, stop the plan.
- [ ] **Step 5: Commit** `test: prove light-DOM web components with Tailwind (wave 1 gate)`.

---

### Task 3: Neutral types and type guards

Spec §4.2.

**Files:**
- Create: `packages/agent-ui/src/types/{message,step,tool,records,guards,index}.ts`
- Modify: `src/index.ts`
- Test: `packages/agent-ui/tests/core/guards.test.mjs`, `tests/types/nodenext/types.ts`

**Interfaces:**
- Produces the spec §4.2 types verbatim: `Role`, `MessageStatus`, `Message`, `Part`, `StepStatus`, `StepBase`, `Step`, `ToolCall`, `Approval`.
- Produces these record types:
  - `Source { id: string; title: string; url?: string; snippet?: string; mediaType?: string }`
  - `TaskItem { id: string; title: string; status: "pending" | "running" | "complete" | "error"; files?: string[] }`
  - `PlanItem { id: string; title: string; description?: string; status: "pending" | "running" | "complete" | "skipped" }`
  - `TestCase { id: string; name: string; status: "pass" | "fail" | "skip"; durationMs?: number; error?: { message: string; stack?: string } }`
  - `TestSuite { id: string; name: string; tests: TestCase[] }`
- Produces these guards:
  - `isTextPart`, `isReasoningPart`, `isFilePart`, `isSourcePart`, `isStepPart`, `isDataPart`, each `(part: Part) => part is Extract<Part, { type: … }>`
  - `isToolStep(step: Step): step is Extract<Step, { kind: "tool" }>`
  - `hasOutput(call: ToolCall): call is ToolCall & { output: NonNullable<ToolCall["output"]> }`

- [ ] **Step 1: Write the failing tests.**

```js
test("hasOutput treats falsy values as output", () => {
  for (const value of [0, false, "", null]) assert.equal(hasOutput({ ...call, output: { state: "available", value } }), true);
  assert.equal(hasOutput({ ...call }), false);
});
test("isStepPart narrows step parts", () => assert.equal(isStepPart({ type: "step", id: "s", step }), true));
```

`tests/types/nodenext/types.ts` imports every type from `@kind-ui/agent-ui` and assigns one literal of each `Step` kind.
- [ ] **Step 2: Run** `npm run test:unit`. Expected: FAIL.
- [ ] **Step 3: Implement.** Reexport each type and guard by name from `src/index.ts`.
- [ ] **Step 4: Run** `npm run test:unit && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(types): add neutral message, step, and tool types`.

---

### Task 4: AI SDK adapter

Spec §4.3.

**Files:**
- Create: `packages/agent-ui/src/adapters/ai-sdk/{index,parts,status,approval}.ts`
- Test: `packages/agent-ui/tests/core/adapter.test.mjs`, `tests/core/fixtures/ui-messages.mjs`, `tests/types/with-ai/adapter.ts`, `tests/types/no-ai/{tsconfig.json,index.ts}`

**Interfaces:**
- Consumes: Task 3 types.
- Produces:
  - `fromUIMessages(messages: UIMessage[], status?: ChatStatus): Message[]`. The last assistant message takes `fromChatStatus(status)`, and earlier messages are `"complete"`.
  - `fromUIMessagePart(part: UIMessage["parts"][number], ctx: { messageId: string; index: number }): Part | null`. It returns `null` only for `step-start`.
  - `fromChatStatus(status: ChatStatus): MessageStatus`, mapping `submitted`→`submitted`, `streaming`→`streaming`, `ready`→`complete`, and `error`→`error`.
  - `toApprovalResponse(approval: Approval, decision: { approved: boolean; reason?: string }): { id: string; approved: boolean; reason?: string }`, with `id = approval.approvalId`.
  - `ai` is imported with `import type` only.
- Mapping rules:
  - Part ids: tool parts use `toolCallId`; all other parts use `${messageId}:${index}`.
  - The tool Step title is the tool name, and `dynamic: true` for `dynamic-tool` parts.
  - Text and reasoning `state` defaults to `"done"`.
  - `source-url` and `source-document` become `source`.
  - `data-<name>` and any unknown type become `{ type: "data", name, data }`.

- [ ] **Step 1: Write the failing tests.** Add one fixture per spec §4.3 tool state, plus these tests:

```js
test("output-available with null output keeps output present", () => {
  const p = fromUIMessagePart(tool({ state: "output-available", output: null }), ctx);
  assert.deepEqual(p.step.call.output, { state: "available", value: null });
  assert.equal(p.step.status, "complete");
});
test("preliminary output maps to preliminary", …);             // output.state === "preliminary"
test("output-denied is cancelled with denied outcome", …);      // status "cancelled", outcome "denied"
test("output-error preserves input", …);                         // input.value deepEquals fixture input
test("approval-responded keeps decision and running status", …);
test("unknown part type becomes data and never throws", …);     // "x-custom" → { type: "data", name: "x-custom" }
test("chat stop does not cancel pending tools", …);             // input-available + "ready" → tool still "running"
test("toApprovalResponse uses approvalId", …);
```

`tests/types/with-ai/adapter.ts` passes a `UIMessage[]` from the pinned `ai`. `tests/types/no-ai` compiles an import of `toApprovalResponse` without `ai` in `types` or `paths`.
- [ ] **Step 2: Run** `npm run test:unit`. Expected: FAIL.
- [ ] **Step 3: Implement.** First compare the pinned `ai` tool part states with spec §4.3, and record any difference under "Tested AI SDK version" in `packages/agent-ui/README.md`.
- [ ] **Step 4: Run** `npm run test:unit && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(adapter): map AI SDK UI messages to neutral types`.

---

### Task 5: Motion helper

Spec §6 "Motion". This is an exception module (spec §2): it supplies animation values, and presence still uses UI SDK `animateIn` / `animateOut`.

**UI SDK:** primitives call these helpers from UI SDK `animateIn` / `animateOut` hooks. Before choosing the hook shape, read the pinned version's "transitions" behaviors in `docs/core.md`.

**Files:**
- Create: `packages/agent-ui/src/core/motion/{index,presets}.ts`
- Modify: `scripts/ui-sdk-exceptions.json` (`"packages/agent-ui/src/core/motion/index.ts": "Motion helper presets (§6)"` only if the guard flags it)
- Test: `packages/agent-ui/tests/core/motion.test.mjs`, `tests/browser/wave-1/motion.spec.ts`

**Interfaces:**
- Produces:
  - `type MotionMode = "auto" | "reduced" | "none"`
  - `type MotionPreset = "fade" | "fade-up" | "expand" | "dot-flow"`
  - `resolveMotion(mode: MotionMode, prefersReduced: boolean): "full" | "reduced" | "none"`
  - `enter(el: HTMLElement, preset: MotionPreset, options?: { motion?: MotionMode }): Promise<void>`
  - `exit(el: HTMLElement, preset: MotionPreset, options?: { motion?: MotionMode }): Promise<void>`
  - `layout(el: HTMLElement, measureBefore: DOMRect, options?: { motion?: MotionMode }): Promise<void>`
  - `reducedKeyframes(preset: MotionPreset): Keyframe[]`
- An `enter` call during a running `exit` reverses from the current value. Running animations are tracked in a `WeakMap<HTMLElement, AnimationPlaybackControls>`.

- [ ] **Step 1: Write the failing tests.**

```js
test("auto follows prefers-reduced-motion", () => {
  assert.equal(resolveMotion("auto", true), "reduced");
  assert.equal(resolveMotion("auto", false), "full");
  assert.equal(resolveMotion("none", false), "none");
});
test("reduced keyframes animate only opacity", () => {
  for (const p of ["fade", "fade-up", "expand", "dot-flow"])
    for (const k of reducedKeyframes(p)) assert.deepEqual(Object.keys(k).filter((x) => x !== "offset"), ["opacity"]);
});
```

Browser test (`?c=motion`): calling `enter` during `exit` ends at `opacity: 1`. Under `reducedMotion: "reduce"`, the fade lasts at most 120 ms.
- [ ] **Step 2: Run** `npm run test:unit`. Expected: FAIL.
- [ ] **Step 3: Implement** with `animate` from `motion` and spring options. The reduced duration is `0.12` s.
- [ ] **Step 4: Run** `npm run test:unit && npx playwright test tests/browser/wave-1/motion.spec.ts && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): add motion helper for UI SDK presence`.

---

### Task 6: Internal general components (UI SDK wrappers)

Spec §2 "Internal general components". Wave 1 needs Button, Collapsible, Scroll Area, Toolbar, Toggle, Menu, Avatar, Token Input, Trigger Menu, File Input, and Progress. Tooltip, Popover, Hover Card, Dialog, Combobox, and the rest arrive with the waves that use them.

**UI SDK:** each item is the ready-made UI SDK component, imported from `@ui-sdk/react/<name>` and `@ui-sdk/web/<name>`. Confirm the exact entry names in each package's `docs/llms.txt`. `src/internal/index.ts` reexports the core behaviors that Wave 1 primitives compose: `bindPanel`, `bindFindable`, `createRovingFocus`, `createFocusRecovery`, `announce`, `createStickToBottom`, `createVirtualizer`, `createInlineEdit`, `createInputHistory`, `isComposing`, and `cellsToText`.

**Files:**
- Create: `packages/agent-ui/src/internal/index.ts`, `src/react/internal/{button,collapsible,scroll-area,toolbar,toggle,menu,avatar,token-input,trigger-menu,file-input,progress}.tsx`, and the matching `src/web/internal/*.ts`
- Test: `tests/browser/wave-1/internal.spec.ts`

**Interfaces:**
- Produces React `KindButton`, `KindCollapsible*`, `KindScrollArea*`, `KindToolbar*`, `KindToggle`, `KindMenu*`, `KindAvatar`, `KindTokenInput*`, `KindTriggerMenu*`, `KindFileInput*`, and `KindProgress`.
- Produces web `defineInternal<Name>()`, registering `kind-internal-<name>` tags.
- Each wrapper passes every prop through to the UI SDK component and adds only Tailwind classes. These components are not exported, and each becomes the registry item `internal-<name>` (Task 16).

- [ ] **Step 1: Write the failing test.** For each wrapper in both projects (`?c=internal&case=<name>`):
  - Axe reports no violations (`new AxeBuilder({ page }).include("[data-case]").analyze()` → `violations` is `[]`).
  - Each wrapper's UI SDK keyboard path works:
    - Button: Enter and Space press it.
    - Collapsible: Enter toggles `aria-expanded`.
    - Menu: ArrowDown moves focus, and Escape closes the menu and returns focus to the trigger.
    - Toggle: Space flips `aria-pressed`.
    - Token Input: Backspace removes the last token.
    - Trigger Menu: typing `@` opens it, and Escape dismisses it.
  - Every root carries the UI SDK `data-slot` attribute.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/internal.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the wrappers. No key, focus, or dismissal code: the guard rejects it.
- [ ] **Step 4: Run** the same command plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(internal): wrap UI SDK controls for wave 1`.

---

### Task 7: Streaming Markdown engine (core)

Spec §6 "Streaming Markdown renderer". This is an exception module (spec §2: content parsing).

**Files:**
- Create: `packages/agent-ui/src/core/markdown/{split,repair,sanitize,ast,engine,index}.ts`
- Test: `packages/agent-ui/tests/core/markdown-{split,repair,sanitize,engine}.test.mjs`, `tests/core/fixtures/long-answer.md` (10,000 tokens or more: prose, lists, a GFM table, and four fenced code blocks)

**Interfaces:**
- Produces:
  - `splitBlocks(source: string): { final: string[]; tail: string }`. A line scanner: a block ends at a blank line outside a fence, or at a closing fence. Tables, lists, and blockquotes continue across their own lines.
  - `repairTail(tail: string): string`. Closes unterminated `*`/`_`/`**`/`__`/`~~`, a backtick span, `[text](url` (as `[text](#)`), and an open fence.
  - `sanitizeUrl(url: string): string | null`. Allows `http:`, `https:`, `mailto:`, and relative URLs (no scheme). Matching is case-insensitive after trimming control characters.
  - `type MdNode`, with node types:
    - `root`, `paragraph`, `heading{depth}`, `text{value}`
    - `emphasis`, `strong`, `delete`, `inlineCode{value}`, `code{lang?, value}`
    - `link{url: string | null}`, `image{url: string | null, alt}`
    - `list{ordered, start?}`, `listItem{checked?}`, `blockquote`
    - `table{align}`, `tableRow`, `tableCell`, `thematicBreak`, `break`
    - Containers carry `children: MdNode[]`. Raw `html` becomes `text`.
  - `toMdNode(mdast: import("mdast").Root): MdNode`
  - `interface MarkdownBlock { key: string; final: boolean; node: MdNode }`, with `key = \`${index}:${fnv1a32hex(blockSource)}\``.
  - `createMarkdownEngine(): { set(source: string, streaming: boolean): MarkdownBlock[]; stats(): { parses: number } }`. An appended source reuses earlier final blocks. A source that doesn't start with the previous one triggers a full rebuild. With `streaming: false`, the tail is final and unrepaired.

- [ ] **Step 1: Write the failing tests.**

```js
test("final blocks are never re-parsed while streaming", () => {
  const e = createMarkdownEngine(); let src = "";
  for (const c of chunks(longAnswer, 20)) { const n = e.stats().parses; src += c; e.set(src, true); assert.ok(e.stats().parses - n <= 2); }
});
test("final block keys are stable across appends", …); // final keys at step n are a prefix of keys at n+1
test("replaced source rebuilds", () => { e.set("# A\n\nfoo", true); assert.equal(text(e.set("# B", true)[0]), "B"); });
test("repair closes an open fence", () => assert.equal(repairTail("```js\nlet a"), "```js\nlet a\n```"));
test("repair closes emphasis and inline code", () => { assert.equal(repairTail("a **b"), "a **b**"); assert.equal(repairTail("a `b"), "a `b`"); });
test("raw html renders as text", …);
test("sanitizeUrl", () => {
  assert.equal(sanitizeUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeUrl(" JaVaScRiPt:x"), null);
  assert.equal(sanitizeUrl("data:text/html,x"), null);
  assert.equal(sanitizeUrl("/docs"), "/docs");
  assert.equal(sanitizeUrl("mailto:a@b.c"), "mailto:a@b.c");
});
```

- [ ] **Step 2: Run** `npm run test:unit`. Expected: FAIL.
- [ ] **Step 3: Implement** with `fromMarkdown(src, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })`.
- [ ] **Step 4: Run** `npm run test:unit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(core): add incremental streaming markdown engine`.

---

### Task 8: Step base and StepList

Spec §5.

**UI SDK:**
- `definePrimitive` for `kind-step` and `kind-step-list`.
- The trigger slot uses `role: "button"` and `press`. The content slot is bound with `bindPanel` + `bindFindable`. Render layers wrap the internal Collapsible.
- StepList uses `createRovingFocus` (roving `focus` on triggers) and `createFocusRecovery`.
- Announcements use `announce`.
- `createParts` in both render layers.

**Files:**
- Create: `packages/agent-ui/src/core/step/{auto-open,step,step-list,index}.ts`, `src/react/step.tsx`, `src/web/step.ts`
- Test: `packages/agent-ui/tests/core/step-auto-open.test.mjs`, `tests/browser/wave-1/step.spec.ts`

**Interfaces:**
- Consumes: Task 5 `enter`/`exit`/`layout`; Task 6 Collapsible and behaviors.
- Produces:
  - `nextOpen(input: { status: StepStatus; prevStatus: StepStatus; open: boolean; userToggled: boolean; autoOpen: "running" | "never" }): boolean`
  - `stepPrimitive` (`kind-step`):
    - Options: `status`, `kind`, `title`, `open`, `defaultOpen`, `onOpenChange: "callback"`, `autoOpen`, `durationSeconds?: number`, `motion`.
    - API: `expand()`, `collapse()`, `toggle()`. Agent: `agent: { actions: ["expand", "collapse"] }`, `controlled: ["open", "status"]`.
    - Slots: `root`, `trigger`, `icon`, `title`, `meta`, `content`, `children`.
    - Root attributes: `data-status`, `data-open`, `data-kind`, and the style `--kind-step-duration: <n>s`.
  - `stepListPrimitive` (`kind-step-list`)
  - React: `Step`, `StepTrigger`, `StepIcon`, `StepTitle`, `StepMeta`, `StepContent`, `StepChildren`, `StepList`. Web: `defineStep()`, `defineStepList()`.
  - `onOpenChange(open, details)` receives `details.source: "pointer" | "keyboard" | "agent" | "auto"`.

- [ ] **Step 1: Write the failing tests.** Unit tests:

```js
test("opens on running", () => assert.equal(nextOpen({ status: "running", prevStatus: "pending", open: false, userToggled: false, autoOpen: "running" }), true));
test("closes on complete, stays open on error", …);
test("user toggle disables auto", …);
test("never mode leaves open unchanged", …);
```

Browser tests, both projects:
- A `beforematch` event on hidden content opens the step.
- StepList has a single Tab stop. ArrowDown, ArrowUp, Home, and End move focus between triggers.
- Removing the focused step moves focus to a sibling trigger.
- The live region gets "<title> complete" and nothing during 20 `running` updates.
- `durationSeconds={3}` sets `--kind-step-duration: 3s`.
- Under reduced motion, expanding animates no `height` or `transform`.
- Axe reports no violations.
- **Agent:** `expectAgentActions(page, "Search the web", ["collapse", "expand"])`, and `act` with `collapse` removes `data-open`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-1/step.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `announce(text, "polite")` fires only on transitions into `awaiting-input`, `complete`, `error`, or `cancelled`, with the text `"<title> needs input"`, `"<title> complete"`, `"<title> failed"`, or `"<title> cancelled"`.
- [ ] **Step 4: Run** the same commands plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(step): add shared Step base and StepList on UI SDK`.

---

### Task 9: Conversation

Spec §7 Wave 1 "Conversation".

**UI SDK:**
- `definePrimitive` for `kind-conversation`.
- The viewport is the internal Scroll Area, with follow-to-end driven by `createStickToBottom`. No hand-written scroll listeners or `scrollTop` writes.
- `createVirtualizer` when `virtualize` is on. `createFocusRecovery` and `announce`.
- The `root` slot declares `role: "log"`.
- `createParts` in both render layers.
- **Exception (spec §2):** the new-message counter.

**Files:**
- Create: `packages/agent-ui/src/core/conversation/{conversation,follow,index}.ts`, `src/react/conversation.tsx`, `src/web/conversation.ts`
- Modify: `scripts/ui-sdk-exceptions.json` only if the guard flags `follow.ts`. Its value is the spec row `"Conversation new-message counter"`.
- Test: `packages/agent-ui/tests/core/conversation-follow.test.mjs`, `tests/browser/wave-1/conversation.spec.ts`

**Interfaces:**
- Produces:
  - `nextFollowState(prev: { following: boolean; newCount: number; count: number }, event: { type: "count"; count: number } | { type: "atBottom"; atBottom: boolean }): { following: boolean; newCount: number; count: number }`. Behavior:
    - When not following, a count increase adds the difference to `newCount`, and a decrease clamps it at `max(0, newCount - removed)`.
    - `atBottom: true` sets `following: true` and `newCount: 0`.
    - `atBottom` events come only from `createStickToBottom`.
  - `conversationPrimitive` (`kind-conversation`):
    - Options: `messageCount: "number"`, `virtualize: "boolean"` (default `false`), `estimateRowHeight: "number"` (default 120).
    - API: `scrollToEnd()`, delegating to `createStickToBottom`. Agent: `agent: { actions: ["scrollToEnd"] }`, `controlled: ["following"]`.
    - Slots: `root` (`role: "log"`, `aria-live="polite"`, label required), `viewport`, `content`, `jump`, `empty`.
    - `jump`: `role: "button"`, `press` → `scrollToEnd`, present when `!following`. Its label is `"Jump to latest"`, with the text `"N new messages"` when `newCount > 0`.
    - `empty`: present when `messageCount === 0`.
  - React: `Conversation`, `ConversationViewport`, `ConversationContent`, `ConversationJump`, `ConversationEmpty`. Web: `defineConversation()`.

- [ ] **Step 1: Write the failing tests.**
  - Unit: counts 10→12→9 while not following give `newCount: 0`. Reaching the bottom resets the count.
  - Browser, both projects:
    - Appends while at the bottom keep the viewport at the bottom.
    - Scroll up 200 px and append 3 messages: the jump control shows "3 new messages" and announces it.
    - Clicking the jump control scrolls to the bottom and hides it.
    - With `virtualize`, 1,000 messages render fewer than 100 rows.
    - Streaming into the last row while scrolled up keeps `scrollTop` within 1 px.
    - The empty part shows at `messageCount=0`.
    - Axe reports no violations.
    - **Agent:** `expectAgentActions(page, "Conversation", ["scrollToEnd"])`, and `act` scrolls to the bottom.
- [ ] **Step 2: Run** the commands. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run**, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(conversation): add follow-to-end log on UI SDK Scroll Area`.

---

### Task 10: Message, Markdown view, Code Block, and Markdown Table

Spec §7 Wave 1 "Message", "Markdown", "Code Block", "Markdown Table"; spec §6 renderer acceptance.

**UI SDK:**
- `definePrimitive` for each of `kind-message`, `kind-markdown`, `kind-code-block`, and `kind-markdown-table`.
- Message: the internal Toolbar, Menu (overflow actions), and Avatar, with `createInlineEdit` for editing. Branch controls are `role: "button"` slots with `press`.
- Code Block: internal Button, Toggle (wrap), and Scroll Area, plus `announce`.
- Markdown Table: internal Scroll Area and `cellsToText`.
- `createParts` in every render file.
- **Exception (spec §2):** clipboard writes, if the pinned UI SDK has no clipboard utility. Check `docs/core.md` "Utilities" first.

**Files:**
- Create: `packages/agent-ui/src/core/{message,markdown-view,code-block,markdown-table}/*.ts`, `src/react/{message,markdown,code-block,markdown-table}.tsx`, `src/web/{message,markdown,code-block,markdown-table}.ts`
- Test: `packages/agent-ui/tests/core/message-branch.test.mjs`, `tests/browser/wave-1/{message,markdown}.spec.ts`

**Interfaces:**
- Consumes: Task 7 `createMarkdownEngine`, `MarkdownBlock`, `MdNode`; Task 6 wrappers and behaviors.
- Produces:
  - `branchLabel(index: number, count: number): string`, returning `` `${index + 1} of ${count}` ``.
  - `messagePrimitive`:
    - Options: `role`, `status`, `text`, `branchIndex`, `branchCount`, and the callbacks `onBranchChange`, `onCopy`, `onRegenerate`, `onEdit`.
    - Actions: `copy`, `regenerate` (only with `onRegenerate`), `edit` (only for the user role with `onEdit`), `setBranch(index)` (only when `branchCount > 1`).
    - Root attributes: `data-role`, `data-status`.
  - `markdownPrimitive`:
    - Options: `source`, `streaming: "boolean"`, `highlight: "value"` (`(code: string, lang: string | undefined) => Promise<Token[]>`).
    - Part state: `blocks: MarkdownBlock[]`.
  - `type Token = { content: string; color?: string; fontStyle?: "italic" | "bold" }`
  - `codeBlockPrimitive`:
    - Options: `code`, `lang`, `highlight`, `wrap` / `defaultWrap` / `onWrapChange`.
    - Actions: `copy` and `toggleWrap`. Announces "Copied".
    - Highlight results are ignored once `code` has changed.
  - `markdownTablePrimitive`: action `copy`, which writes TSV built with `cellsToText`.
  - React: `Message`, `MessageAvatar`, `MessageContent`, `MessageToolbar`, `MessageBranch`, `Markdown`, `CodeBlock`, `MarkdownTable`. Web: `defineMessage()`, `defineMarkdown()`, `defineCodeBlock()`, `defineMarkdownTable()`. Markdown renders fenced code with CodeBlock and tables with MarkdownTable.

- [ ] **Step 1: Write the failing tests.**
  - Unit: `branchLabel(0, 3) === "1 of 3"`.
  - Browser, both projects:
    - **Acceptance:** stream `long-answer.md` in 20-character chunks. Each element with `data-block-key` in a final block stays the same DOM node (`===`, compared via handles kept on `window`), and the engine reports at most 2 parses per append.
    - `[x](javascript:alert(1))` renders as text with no `<a>`.
    - `<img onerror>` renders as literal text.
    - With `branchCount=3`, the label shows "1 of 3", and Next changes it to "2 of 3".
    - Editing: Escape restores the text, and Enter calls `onEdit`.
    - Code Block copy writes to the clipboard and announces "Copied".
    - A late highlight result for old `code` is ignored.
    - Table copy produces TSV.
    - Axe reports no violations.
    - **Agent:**
      - `expectAgentActions(page, "Assistant message", ["copy", "regenerate", "setBranch"])` with all callbacks.
      - `expectAgentActions(page, "Assistant message", ["copy"])` with `?case=no-callbacks`.
      - `expectAgentActions(page, "Code", ["copy", "toggleWrap"])`.
      - `expectAgentActions(page, "Table", ["copy"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-1/message.spec.ts tests/browser/wave-1/markdown.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** React keys block elements by `block.key`. The web layer patches only the last non-final block's DOM subtree.
- [ ] **Step 4: Run**, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add Message, streaming Markdown, Code Block, and Markdown Table`.

---

### Task 11: Composer (full) and Attachments

Spec §7 Wave 1 "Composer", "Attachments"; spec §4.1 composer contract.

**UI SDK:**
- The Composer input is the internal Token Input, which replaces Task 2's textarea.
- Mentions and commands open the internal Trigger Menu. No hand-written popups, dismissal, or active-descendant handling.
- Attaching uses the internal File Input. Recall uses `createInputHistory`, and composition checks use `isComposing`. Submit and Stop use the internal Button.
- Attachments: `definePrimitive` with `createRovingFocus` across items, each with `role: "button"` and `press`.
- `createParts` in every render file.
- **Exceptions (spec §2):** the submit key policy, declared as the input slot's `keys` with `on.keydown`; attachment removal on Delete/Backspace, declared as the item slot's `keys`; and draft settlement.

**Files:**
- Modify: `packages/agent-ui/src/core/composer/composer.ts`, `src/react/composer.tsx`, `src/web/composer.ts`
- Create: `packages/agent-ui/src/core/composer/draft.ts`, `src/core/attachments/{attachments,index}.ts`, `src/react/attachments.tsx`, `src/web/attachments.ts`
- Modify: `scripts/ui-sdk-exceptions.json`, adding entries only for files the guard flags, valued with the matching spec rows
- Test: `packages/agent-ui/tests/core/composer-draft.test.mjs`, `tests/browser/wave-1/composer.spec.ts`

**Interfaces:**
- Consumes: Task 6 Token Input, Trigger Menu, File Input, Button, and behaviors.
- Produces types:
  - `ComposerToken { id: string; kind: "mention" | "command"; value: string; label: string }`
  - `ComposerAttachment { id: string; file: File; name: string; size: number; mediaType: string; error?: "type" | "size" }`
  - `ComposerDraft { text: string; tokens: ComposerToken[]; attachments: ComposerAttachment[] }`
  - `ComposerTriggerItem { value: string; label: string; description?: string }`
- Produces `isSubmittable(draft: ComposerDraft): boolean`. It returns true when `text.trim() !== ""`, or when the draft has a token, or an attachment without `error`.
- Produces `draftAfterSettle(current: ComposerDraft, submitted: ComposerDraft, outcome: "resolved" | "rejected"): ComposerDraft`:
  - `resolved`: returns an empty draft when `current` deep-equals `submitted`, and otherwise returns `current`.
  - `rejected`: returns `current`.
- Produces `composerPrimitive` options:
  - `value`, `defaultValue`, and `onValueChange: "callback"` (receives `ComposerDraft` and `details.source`)
  - `onSubmit: "action"`, `onStop: "callback"`
  - `submitOn: "enter" | "mod-enter"` (default `"enter"`)
  - `mentions: "value"`, `commands: "value"`
  - `accept: "string"`, `maxSize: "number"`, `history: "value"`
  - `disabled: "boolean"`, `agentConfirm: "boolean"` (default `true`)
- Composer actions: `setValue`, `insertToken`, `removeAttachment`, `submit`, and `stop`.
  - `stop` is listed only while pending and only when `onStop` is supplied.
  - `submit` renders `data-agent-confirm` unless `agentConfirm === false`.
  - Passing both `value` and `defaultValue` throws `TypeError("Composer: value and defaultValue are mutually exclusive")`.
- Produces `attachmentsPrimitive` (`kind-attachments`) with options `items: "value"` and `onRemove: "callback"`, and action `remove(id)`.
- React: `Composer`, `ComposerInput`, `ComposerSubmit`, `ComposerStop`, `ComposerAttach`, `ComposerTriggerMenu`, `Attachments`, `Attachment`. Web: `defineComposer()`, `defineAttachments()`.

- [ ] **Step 1: Write the failing tests.**

```js
test("whitespace-only draft is not submittable", () => assert.equal(isSubmittable({ text: "   ", tokens: [], attachments: [] }), false));
test("resolved clears an unchanged draft", () => assert.deepEqual(draftAfterSettle(d("hi"), d("hi"), "resolved"), d("")));
test("resolved keeps newer edits", () => assert.deepEqual(draftAfterSettle(d("hi there"), d("hi"), "resolved"), d("hi there")));
test("rejected keeps the draft", () => assert.deepEqual(draftAfterSettle(d("hi"), d("hi"), "rejected"), d("hi")));
```

Browser tests, both projects, with a deferred `onSubmit`:
- **Submission:**
  - A double click submits once.
  - Typing while pending and then resolving keeps the new text; rejecting keeps the draft.
  - Enter on whitespace doesn't submit, and Shift+Enter inserts a newline.
  - With `submitOn="mod-enter"`, Enter inserts a newline and Ctrl/Meta+Enter submits.
  - Enter during IME composition doesn't submit.
  - A consumer `onKeyDown` that calls `preventDefault` blocks submission.
  - Focus stays in the input through submit.
  - Unmounting while pending and then resolving raises no console error.
- **Tokens and history:**
  - `@` opens the Trigger Menu listbox, and choosing an item inserts a token.
  - `/` opens commands, and Escape closes the menu.
  - ArrowUp in an empty input recalls the last history entry.
- **Attachments:**
  - A pasted file over `maxSize` shows "File is too large" and can't be submitted.
  - Delete on a focused attachment removes it, and focus moves to its neighbor.
- **Stop:** the Stop button appears only while pending with `onStop`.
- **Accessibility:** axe reports no violations.
- **Agent:**
  - Idle: `expectAgentActions(page, "Message", ["insertToken", "removeAttachment", "setValue", "submit"])`.
  - While pending with `onStop`: the actions include `stop`.
  - Agent `submit` is refused without approval.
  - `expectAgentActions(page, "Attachments", ["remove"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-1/composer.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Snapshot the draft at submit, and ignore settlement after `onDestroy`. Announce pending and error states with `announce`.
- [ ] **Step 4: Run**, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(composer): build on UI SDK Token Input, Trigger Menu, and File Input`.

---

### Task 12: Uploader and indicators

Spec §7 Wave 1 "Uploader", "Loader", "Thinking Indicator", "Typing Indicator", "Streaming Text".

**UI SDK:**
- Uploader: `definePrimitive` with the internal File Input, internal Progress per item (`aria-valuenow` comes from UI SDK Progress), and `announce`.
- Indicators: `definePrimitive` with a `root` slot declaring `role: "status"`. Decorative dot slots set `aria-hidden` through slot `attrs`.
- Streaming Text: `definePrimitive`, whose chunk presence uses `animateIn` with the Task 5 presets.
- `createParts` in every render file.
- **Exception (spec §2):** the Streaming Text append diff.

**Files:**
- Create: `packages/agent-ui/src/core/{uploader,loader,thinking-indicator,typing-indicator,streaming-text}/*.ts`, `src/react/{uploader,loader,thinking-indicator,typing-indicator,streaming-text}.tsx`, and the matching `src/web/*.ts`
- Test: `packages/agent-ui/tests/core/streaming-text.test.mjs`, `tests/browser/wave-1/{uploader,indicators}.spec.ts`

**Interfaces:**
- Produces `UploadItem { id: string; name: string; size: number; progress: number; status: "queued" | "uploading" | "done" | "error" | "cancelled"; error?: string }`.
- Produces `uploaderPrimitive` (`kind-uploader`):
  - Options: `items: "value"`, `onFiles: "callback"`, `onCancel: "callback"`, `onRetry: "callback"`, `accept`, `maxSize`.
  - Actions: `cancel(id)` (listed while any item is queued or uploading, with `onCancel`) and `retry(id)` (listed while any item has an error, with `onRetry`).
  - Announces `"<name> uploaded"` and `"<name> failed"`.
- Produces `loaderPrimitive`, `thinkingIndicatorPrimitive`, and `typingIndicatorPrimitive`. Options: `label` (defaults: "Loading", "Thinking", "Typing") and `motion`. The dots use the `"dot-flow"` preset with a delay of `i * 0.15` s.
- Produces `streamingTextDiff(prev: string, next: string): { kind: "append"; appended: string } | { kind: "reset" }`.
- Produces `streamingTextPrimitive` with options `text`, `caret: "boolean"`, and `motion`.
- React: `Uploader`, `Loader`, `ThinkingIndicator`, `TypingIndicator`, `StreamingText`. Web: `defineUploader()`, `defineLoader()`, `defineThinkingIndicator()`, `defineTypingIndicator()`, `defineStreamingText()`.

- [ ] **Step 1: Write the failing tests.**

```js
test("append diff", () => assert.deepEqual(streamingTextDiff("Hel", "Hello"), { kind: "append", appended: "lo" }));
test("shrink or replace resets", () => {
  assert.deepEqual(streamingTextDiff("Hello", "Hi"), { kind: "reset" });
  assert.deepEqual(streamingTextDiff("abc", "xbcd"), { kind: "reset" });
});
```

Browser tests, both projects:
- **Indicators:**
  - Each indicator has role `status` with its default label, and the dots are hidden from the accessibility tree.
  - Dot opacities sampled at one instant differ.
  - Under reduced motion, `document.getAnimations()` is empty for the dots.
- **Streaming Text:**
  - Appended chunks enter with opacity below 1.
  - After a reset, no span is animating.
  - Under reduced motion, the text appears instantly.
- **Uploader:** progress is exposed through `aria-valuenow`. Cancel calls `onCancel(id)`, and Retry shows only for items with an error.
- **Accessibility:** axe reports no violations.
- **Agent:**
  - `expectAgentActions(page, "Uploads", ["cancel", "retry"])` for the mixed-status case.
  - `expectAgentActions(page, "Thinking", [])`: the indicator is listed with no actions, which proves it is registered as a primitive.
- [ ] **Step 2: Run** the commands. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run**, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add Uploader, Loader, Thinking, Typing, and Streaming Text`.

---

### Task 13: Cross-component agent conformance

Spec §6 "Agent actions", §10 "Agent actions". Per-component snapshots are already in Tasks 2 and 8–12. This task covers the bridge behaviors they share.

**Files:**
- Create: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*`, a page with every Wave 1 component, each with an accessible name
- Test: `tests/browser/wave-1/agent.spec.ts`

- [ ] **Step 1: Write the test**, in both projects:
  - The snapshot lists all 13 Wave 1 components by label. This guards against a component that renders without registering.
  - `act` runs each listed action, and the resulting attributes match the pointer path.
  - Change callbacks receive `details.source === "agent"`, and a cancelling callback leaves the state unchanged.
  - `composer.submit` is refused when the permission callback denies it.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/agent.spec.ts`. Expected: PASS. Fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add wave 1 agent conformance`.

---

### Task 14: Styles and theme tokens

**Files:**
- Modify: `packages/agent-ui/src/styles/agent-ui.css`
- Test: `scripts/tests/styles.test.mjs`

**Interfaces:**
- Produces `@theme default` tokens:
  - `--kind-color-{surface,muted,border,accent,danger,success,warning}`
  - `--kind-radius`
  - `--kind-font-mono`
- Consumer variables override these defaults.

- [ ] **Step 1: Write the failing test.** The file declares every token above under `@theme default`, and contains no rule other than `@theme` and `@source`.
- [ ] **Step 2: Run** `node --test scripts/tests/styles.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Replace hard-coded colors in the render files from Tasks 2–12 with token utilities.
- [ ] **Step 4: Run** the test plus `npm run test:browser`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(styles): add theme tokens`.

---

### Task 15: Packed-package check

Spec §10 "Packed package" and "Types".

**Files:**
- Create: `scripts/check-package.mjs`, `tests/types/{bundler,nodenext}/tsconfig.json`
- Test: `scripts/tests/check-package.test.mjs`

**Interfaces:**
- Produces `artifacts/package/manifest.json` (`{ "tarball": string, "sha256": string, "version": string }`) and `findForbiddenImports(files: string[]): string[]`.
- The check runs these steps:
  1. `npm pack` into `artifacts/package/`.
  2. `publint` and `attw --pack` pass.
  3. The tarball has `dist/styles/agent-ui.css` and no `src/react` or `src/web`.
  4. `dist/core/**` and `dist/index.js` import no `react`, `react-dom`, or `ai`.
  5. A clean consumer without `ai` (`artifacts/packed-no-ai/`) imports all three JS entries with `node` and compiles under both NodeNext and Bundler.
  6. A consumer with the pinned `ai` compiles `tests/types/with-ai/adapter.ts`.

- [ ] **Step 1: Write the failing test.** `findForbiddenImports([fixtureWith('import "react"')])` deep-equals `["react"]`.
- [ ] **Step 2: Run** `node --test scripts/tests/check-package.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run check:package`. Expected: exit 0, and the manifest exists.
- [ ] **Step 5: Commit** `build: add packed-package gate`.

---

### Task 16: Registry catalog, build, and consumer check

Spec §9.2, §9.6, §10 "Registry consumers".

**Files:**
- Create: `registry/{catalog.mjs,README.md}`, `scripts/build-registry.mjs`, `scripts/check-registry-consumers.mjs`
- Test: `scripts/tests/registry.test.mjs`

**Interfaces:**
- Consumes: Task 15's `artifacts/package/manifest.json`.
- Produces: the `catalog.mjs` default export `{ packageVersion: string; uiSdkVersion: string; items: RegistryItem[] }`, where `RegistryItem { name: string; type: "registry:ui"; layer: "react" | "web"; hidden?: boolean; files: string[]; registryDependencies: string[]; dependencies: string[] }`.
- Wave 1 items:
  - `step`, `conversation`, `message`, `markdown`, `code-block`, `markdown-table`, `composer`, `attachments`, `uploader`, `loader`, `thinking-indicator`, `typing-indicator`, `streaming-text`
  - each with a `-web` twin
  - hidden `internal-<name>` items, with `-web` twins, for the Task 6 wrappers
  - every item lists `@ui-sdk/react@<pin>` or `@ui-sdk/web@<pin>` in `dependencies`
- Produces: `validateCatalog(catalog, pkg): string[]` and the build output `artifacts/registry/r/{registry.json,<name>.json}`, built with `npx shadcn@<pin> build`. The build fails when:
  - item names are duplicated
  - `packageVersion` differs from the package version
  - an item's `@ui-sdk/*` version differs from the `@ui-sdk/core` pin
  - a staged file's bytes differ from its source
  - a render file imports core by a relative path
  - a hidden item appears anywhere other than inside `registryDependencies`
  - a file fails `checkUiSdkUsage`
- The `css` field registers `@kind-ui/agent-ui/styles.css`.
- `check-registry-consumers.mjs`:
  1. Serves `artifacts/registry/r/` on `127.0.0.1:4320`.
  2. Creates clean `artifacts/registry-consumers/{vite-react,vite-web}` projects and installs the tarball.
  3. Runs `npx shadcn@<pin> add http://127.0.0.1:4320/r/<item>.json` for each visible item.
  4. Builds the consumers and renders each item with Playwright.
  5. Checks that the installed `@ui-sdk/*` and `@kind-ui/agent-ui` versions match the pins.
  6. Writes `artifacts/registry/consumer-evidence.json`.

- [ ] **Step 1: Write the failing tests.**

```js
test("duplicate names fail", () => assert.match(validateCatalog(withDup, pkg).join(), /duplicate item name "composer"/));
test("version drift fails", () => assert.match(validateCatalog({ ...cat, packageVersion: "9.9.9" }, pkg).join(), /packageVersion/));
test("relative core import fails", …);   // error mentions @kind-ui/agent-ui/core
test("ui-sdk pin drift fails", …);       // item with @ui-sdk/web@0.0.1 → error
test("names have no product prefix", () => { for (const i of catalog.items) assert.doesNotMatch(i.name, /^agent-/); });
```

- [ ] **Step 2: Run** `node --test scripts/tests/registry.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm run build:registry && npm run check:registry-consumers`. Expected: exit 0, and the evidence lists 13 React and 13 Web items rendered.
- [ ] **Step 5: Commit** `build: add agent-ui registry and consumer checks`.

---

### Task 17: Docs site and Wave 1 pages

Spec §9.5, §9.6.

**Files:**
- Create: `apps/docs/{package.json,vite.config.mjs,tsconfig.json}`, `apps/docs/src/{layout.tsx,styles.css}`, `apps/docs/pages/<slug>/{index.html,page.tsx}`
- Test: `apps/docs/scripts/pages.test.mjs`

**Interfaces:**
- Produces the private workspace `@kind-ui/agent-ui-docs`, a Vite multi-page build with `base: "/agent-ui/"` that outputs to `apps/docs/dist/`.
- Pages:
  - `getting-started`, which covers the UI SDK prerequisites and the skill
  - `ai-sdk-adapter`
  - `agents`, covering `createAgent` for React and Web Components, plus WebMCP `registerTools`
  - `showcase/wave-1`
  - `components/<name>`, one per visible Wave 1 React item
- Each component page has these H2 headings, in order: `Install`, `Exports`, `Options`, `State ownership`, `Callbacks`, `Errors`, `Keyboard`, `Agent actions`, `Built on UI SDK`, `Tested versions`, `Examples`.
  - `Built on UI SDK` lists the UI SDK components and behaviors the component composes, copied from spec §7.
  - `Install` shows `npx shadcn@latest add @kind-ui/<name>` and `@kind-ui/<name>-web`.

- [ ] **Step 1: Write the failing test.** Every visible React item has its page, with the eleven headings in order. No page mentions an `internal-` item. `vite.config.mjs` has `base: "/agent-ui/"`.
- [ ] **Step 2: Run** `node --test apps/docs/scripts/pages.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the test, then `npm run build:docs`. Expected: PASS, and `apps/docs/dist/components/composer/index.html` exists.
- [ ] **Step 5: Commit** `docs: add docs site with wave 1 reference and showcase`.

---

### Task 18: CI, version, and release workflows, plus the Wave 1 changeset

Spec §9.3, §9.4, §9.6.

**Files:**
- Create: `.github/workflows/{ci,version,release}.yml`, `scripts/check-registry-namespace.mjs`, `scripts/pack-site.mjs`, `.changeset/agent-ui-wave-1.md` (`"@kind-ui/agent-ui": minor`)
- Modify: `scripts/run-checks.mjs` (every stage is now required)
- Test: `scripts/tests/workflows.test.mjs`

**Interfaces:**
- `ci.yml`:
  - Jobs: `fast` (which includes `npm run lint`, and so the UI SDK guard), `packed`, `browser` (shards 1–4), and `check` ("All checks", `if: always()`, which requires the other three).
  - Node 22 and npm 11.9.0.
  - Every action is pinned by full SHA, with `permissions: contents: read`.
- `version.yml`: `changesets/action` opens a draft version PR.
- `release.yml`:
  - Jobs run `plan` → `validate` → `verify` → `publish` → `github-release`, guarded by `github.repository == 'kind-ui/agent-ui'`.
  - `publish` uses `environment: npm-release` and `id-token: write`, and runs `npm publish <tarball> --ignore-scripts --access public --tag <dist-tag>`.
  - `validate` runs `check-registry-namespace.mjs`.
  - `github-release` runs `pack-site.mjs` and uploads `agent-ui-site-<version>.tar.gz` plus its `.sha256`.
- `findCollisions(live: { items: { name: string }[] }, previous: string[], ours: string[]): string[]`. The live catalog comes from `https://kindui.dev/r/registry.json`. The previous names come from the latest release asset, or are empty when no release exists.
- `pack-site.mjs` tars `apps/docs/dist/` as `docs/` and `artifacts/registry/r/` as `r/`.

- [ ] **Step 1: Write the failing tests.**

```js
test("findCollisions flags charts items only", () =>
  assert.deepEqual(findCollisions({ items: [{ name: "line-chart" }, { name: "composer" }] }, ["composer"], ["composer", "line-chart"]), ["line-chart"]));
test("publish job is guarded and uses npm-release", …);
test("all actions are pinned by SHA", …);       // every uses: matches /@[0-9a-f]{40}/
test("ci check job requires fast, packed, browser", …);
test("ci fast job runs npm run lint", …);       // keeps the UI SDK guard in CI
```

- [ ] **Step 2: Run** `node --test scripts/tests/workflows.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add `yaml` as an exact-pinned root dev dependency.
- [ ] **Step 4: Run** `node --test scripts/tests/workflows.test.mjs && npm run check`. Expected: PASS end to end.
- [ ] **Step 5: Commit** `ci: add CI, version, and release workflows with site handoff`.

Publishing 0.1.0 is out of scope. It requires three things:
- a maintainer explicitly authorizes flipping `"private"` to `false`
- npm trusted publishing is configured
- the kind-ui/charts kindui.dev deployment change from spec §9.6 lands

---

## How this plan enforces "build on UI SDK"

| Requirement | Where enforced |
| --- | --- |
| Exact `@ui-sdk/*` installs, skill, and `AGENTS.md` docs note | Task 1 (manifest test, file check) |
| Every core component is a `definePrimitive` | Task 1 guard rule 1, run by `npm run lint` in every task and in CI (Task 18) |
| Every render file uses `createParts` or wraps a UI SDK component | Task 1 guard rule 2; re-run on registry files in Task 16 |
| No hand-written focus, keyboard, scroll, or ARIA code outside spec §2 exceptions | Task 1 guard rules 3–5 (`ui-sdk-exceptions.json` values must match spec rows) |
| Named UI SDK pieces per component | Each component task's **UI SDK:** line, which matches the spec §7 "Composes (UI SDK)" column |
| Components are live UI SDK primitives exposing their actions | `expectAgentActions` per component (Tasks 2, 8–12), plus the all-components snapshot in Task 13 |

## Self-Review Notes

- **Spec coverage:**
  - §2 rules, UI SDK enforcement, and exceptions: Global Constraints and Task 1
  - Internal components: Task 6
  - Layout and scripts: Tasks 1 and 18
  - §3: Tasks 1 and 15
  - §4.1: Tasks 4, 8, and 11
  - §4.2: Task 3; §4.3: Task 4; §5: Task 8
  - §6: Tasks 5, 7, 10, and 13
  - §7 Wave 1: all 13 rows across Tasks 8–12
  - §8: axe and keyboard checks in each component task
  - §9.2: Task 16; §9.3–9.4: Task 18; §9.5–9.6: Tasks 17 and 18
  - §10: Tasks 1–18
  - §12 gate: Task 2
- **Out of scope:**
  - Waves 2–4, the ANSI parser
  - Tooltip, Popover, Hover Card, and Dialog wrappers, which spec §2 assigns to later-wave components
  - kind-ui/charts cleanup (spec §11) and the kindui.dev deployment change
