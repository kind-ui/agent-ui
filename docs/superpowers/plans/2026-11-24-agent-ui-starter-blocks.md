# Agent UI starter blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one PR.

**Goal:** Ship two shadcn `registry:block` starters, `coding-agent-starter` and `general-agent-starter`, that install a working agent screen in a Next.js app with one `npx shadcn add`, run on a mock transport with no API key, go live with one line, open in v0, and replace the three showcases.

**Architecture:** A block is four files in `apps/docs/examples/blocks/<block>/` (page, client composition, mock transport, AI SDK route) composed only from existing React components. `registry/catalog.mjs` makes each a `registry:block` item for the CLI, and `scripts/build-registry.mjs` also writes a flattened, namespace-free `r/v0/<block>.json` for v0. One flow per block runs in the React fixture and in a Next consumer built from the installed block.

**Tech Stack:** Next.js App Router, React 19, `ai@7.0.173`, `@ai-sdk/react@4.0.177` (its `ai` dependency is exactly `7.0.173`), `zod@4.6.7`, shadcn CLI `4.23.0`, Playwright. No change to `@kind-ui/agent-ui`'s source.

**Spec:** `docs/superpowers/specs/2026-11-24-agent-ui-starter-blocks-design.md` (D1–D9). Also read `docs/design-principles.md`, `AGENTS.md` (Verification policy, the streaming UX checklist, "Registry (Task 16)", "Docs site (Task 17)"), `registry/README.md`, and `apps/docs/content/docs/guides/{ai-sdk-chat,tool-approvals}.mdx`, which the blocks' data code follows.

## Global Constraints

- **Thin blocks (spec §1):** no new component, primitive, token or stylesheet; page layout through Tailwind layout utilities only. A missing look or behavior is reported as a component gap in the PR, not built in the block.
- **React only (D2):** no `-vue`, `-svelte`, `-solid` or `-web` block items.
- **Pins:** `ai@7.0.173`, `@ai-sdk/react@4.0.177`, `zod@4.6.7`, exact, in the block items, the docs app and the root dev dependencies.
- **Mock first (D3):** the shipped page line is `const transport = createMockTransport();`; the live line is `const transport = new DefaultChatTransport({ api: "/api/<folder>" });`. No env flag picks between them.
- **Paths (D4):** sources in `apps/docs/examples/blocks/<folder>/`; installed to `app/<folder>/page.tsx`, `@components/blocks/<folder>/<folder>.tsx`, `@components/blocks/<folder>/mock.ts`, `app/api/<folder>/route.ts`. `<folder>` is `coding-agent` or `general-agent`.
- **Tests:** fixtures and `delayMs: 0` only, no live model, no timing sleeps (AGENTS.md Conventions). Never name or copy an outside product in code, docs, tests or PRs.
- **Ports:** Task 1 `KIND_FIXTURE_PORT_BASE=5600`, Task 2 `5610`, Task 3 `5620`, Task 4 `5630`, each with `KIND_LAYERS=react`.
- **Shared files:** Task 1 adds markers `blocks-task-2: Coding agent starter` and `blocks-task-3: General agent starter` to `registry/catalog.mjs` (in `blocks`) and to `AGENTS.md` (under "UI SDK API notes"), and the same rule as "Wave 6 shared-file markers" applies. `apps/docs/content/docs/blocks/meta.json` is JSON: a task that lands second rebases and keeps both entries.

## Review Focus

- **Installing into an app that already has a home page and a chat route:** nothing of the app's is overwritten. Task 1's consumer pre-creates `app/page.tsx` and `app/api/chat/route.ts` and asserts both are byte-identical after `shadcn add`.
- **Denying the approval:** the tool keeps "Denied", no Terminal output appears, and the turn ends with the agent's short reply. Task 2's flow denies once on a second turn.
- **Stop mid-stream:** Stop takes Send's place, pressing it ends the stream, the message shows its "Stopped" outcome and Send comes back. Task 2's flow stops the second turn.
- **390 px:** the general agent's Sidebar is a drawer, Thread Search opens as a sheet, and the composer's controls collapse to icons (Composer on narrow screens). Task 3's spec runs its flow at 390 px with touch.
- **A new chat:** New chat shows the Conversation's empty state and the first send creates the thread at the top of Thread List under "Today". Task 3's flow covers it.

---

## Parallel batches

| Batch | Tasks | Starts after | Files they share |
| --- | --- | --- | --- |
| 0 | 1 (groundwork, v0 check) | this plan | none |
| A | 2, 3 | Task 1 merged | only the marked lines and `blocks/meta.json` |
| B | 4 (showcases out, changeset) | Tasks 2 and 3 merged | docs nav, docs test |

If Task 1's v0 check fails (step 9), Tasks 2 and 3 still run; the toolbar leaves out **Open in v0** and the spec's D6 records why.

## Block task routine

Tasks 2 and 3 finish with these steps after their flow passes.

- [ ] **Docs page:** `apps/docs/content/docs/blocks/<folder>.mdx` as spec D8 says: summary, `<BlockToolbar name="<block>" />`, `<Example>` with the block, `<ExampleCode example="blocks/<folder>/…">` for the four files, "Go live" (the one-line diff, `AI_GATEWAY_API_KEY`), "What's inside" (each component linked). Add it to `blocks/meta.json`. Follow `write-docs` and `fumadocs`. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** the fixture page at 1280 and 390 px, light and dark, nothing focused, plus the approval (coding) or the open drawer (general), into `artifacts/screenshots/<block>-*.png`, attached with `github-pr-media`. Judge them against spec §2 and the design principles; run `impeccable` `critique` and `web-interface-guidelines` on them.
- [ ] **Finish:** `unslop`, then `expert-review` (react and styles experts), then `npm run check` once through a subagent with the task's port. Expected: PASS. Note any component gap found in the PR body, not in code.
- [ ] **Commit and PR:** `feat(blocks): <block>`, push, open the PR against `main`.

---

### Task 1: Block groundwork and the v0 check

Spec D3–D8.

**Files:**
- Modify: `registry/catalog.mjs` (`blocks` record with markers, `blockItems()`), `scripts/build-registry.mjs` (write `r/v0/<block>.json`), `scripts/check-registry-consumers.mjs` (Next consumer), `scripts/affected-specs.mjs` (follow `apps/docs/examples/blocks/` to `tests/browser/blocks/`), `scripts/tests/{registry,docs}.test.mjs`, `playwright.config.mjs` (`blocks-react` project), `packages/agent-ui/tests/fixtures/react/vite.config.mjs` (aliases), `apps/docs/tsconfig.json` (alias), `apps/docs/package.json` and root `package.json` (pins), `apps/docs/content/docs/meta.json`, `AGENTS.md`, `registry/README.md`
- Create: `apps/docs/components/block-toolbar.tsx`, `apps/docs/content/docs/blocks/{index.mdx,meta.json}`, `registry/consumers/next/` (`package.json` template, `components.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/api/chat/route.ts` stand-ins), `scripts/tests/fixtures/blocks/hello/` (a test-only block: `page.tsx`, `hello.tsx` rendering one Step, `mock.ts`, `route.ts`)

**Interfaces:**
- Produces, `registry/catalog.mjs`: `blocks: Record<string, { title: string; description: string; folder: string; uses: string[] }>`; `blockItems(blocks, { exampleRoot = "apps/docs/examples/blocks" })` returns the CLI items of spec D5; exported for tests.
- Produces, `scripts/build-registry.mjs`: `v0Payload(item, itemsByName): RegistryItem` (spec D6: transitive files inlined with their CLI targets, `registryDependencies: []`, no `css`/`cssVars`/`envVars`, merged `dependencies`, the page prefixed with `import "@kind-ui/agent-ui/styles.css";\n`), written to `artifacts/registry/r/v0/<block>.json`.
- Produces, docs: `<BlockToolbar name: string />` (install command with copy, Open in v0 link to `https://v0.dev/chat/api/open?url=${origin}/r/v0/${name}.json` with `origin` from `NEXT_PUBLIC_REGISTRY_ORIGIN` defaulting to `https://kindui.dev`, View code anchor); alias `@/components/blocks/*` → `./examples/blocks/*` (before `@/*`).
- Produces, fixtures: React fixture aliases `@/components/ui/*` → `src/react/*` and `@/components/blocks/*` → `apps/docs/examples/blocks/*`.
- Produces, tests: a flow module shape `export async function run(page: Page): Promise<void>` in `tests/browser/blocks/<block>.flow.ts`; the consumer imports each block's flow by name and runs it on `/<folder>`.

- [ ] **Step 1: Write the failing registry tests** in `scripts/tests/registry.test.mjs`:

```js
test("a block is a registry:block over React items", () => {
  const [item] = blockItems({ hello: { title: "Hello", description: "d", folder: "hello", uses: ["step"] } }, { exampleRoot: "scripts/tests/fixtures/blocks" });
  assert.equal(item.type, "registry:block");
  assert.deepEqual(item.registryDependencies, ["@kind-ui/agent-ui-setup", "@kind-ui/step"]);
  assert.deepEqual(item.files.map((f) => [f.type, f.target]), [
    ["registry:page", "app/hello/page.tsx"],
    ["registry:component", "@components/blocks/hello/hello.tsx"],
    ["registry:lib", "@components/blocks/hello/mock.ts"],
    ["registry:page", "app/api/hello/route.ts"],
  ]);
  assert.ok(item.dependencies.includes("ai@7.0.173") && item.dependencies.includes("@ai-sdk/react@4.0.177"));
  assert.deepEqual(item.meta, { layer: "react", block: true });
});
test("the v0 payload is flat, namespace-free and css-free", () => {
  const v0 = v0Payload(helloItem, itemsByName);
  assert.deepEqual(v0.registryDependencies, []);
  assert.equal(v0.css, undefined); assert.equal(v0.cssVars, undefined); assert.equal(v0.envVars, undefined);
  assert.ok(!JSON.stringify(v0).includes('"@kind-ui/agent-ui-setup"'));
  assert.ok(v0.files.some((f) => f.target === "@ui/step.tsx"));
  assert.ok(v0.files.find((f) => f.target === "app/hello/page.tsx").content.startsWith('import "@kind-ui/agent-ui/styles.css";\n'));
});
test("React component items still match src/react, blocks aside", () => { /* existing comparison, filtering meta.block */ });
```

- [ ] **Step 2: Run** `node --test scripts/tests/registry.test.mjs`. Expected: the new tests FAIL (`blockItems` not exported).
- [ ] **Step 3: Implement** `blocks`, `blockItems` and `v0Payload`, and have the build write `r/v0/*.json` and validate each against `https://ui.shadcn.com/schema/registry-item.json` (the schema the CLI items already use). Keep `blocks` empty except the two markers; the tests use the hello fixture. Exclude `meta.block` items from every "component" list (`scripts/tests/registry.test.mjs`'s React comparison, the docs `Install` tabs, `parity.test.mjs`).
- [ ] **Step 4: Run** `node --test scripts/tests/registry.test.mjs && npm run build:registry`. Expected: PASS.
- [ ] **Step 5: Next consumer.** In `check-registry-consumers.mjs`, when the catalog has blocks (or `KIND_BLOCKS_FIXTURE=1`, which adds the hello block for this task's own run), create a Next 16 App Router app from `registry/consumers/next/` under the OS temp directory, run `shadcn add @kind-ui/<block>` for each, assert the pre-created `app/page.tsx` and `app/api/chat/route.ts` are unchanged (Review Focus 1), `next build`, `next start` on a free port, and run `tests/browser/blocks/<block>.flow.ts` in Chromium. Write the results into `consumer-evidence.json`. Run `KIND_BLOCKS_FIXTURE=1 KIND_LAYERS=react npm run check:registry-consumers` after `npm run check:package`. Expected: PASS with the hello block rendering one Step.
- [ ] **Step 6: Fixture and Playwright.** Add the React fixture aliases, the `blocks-react` project (`testMatch: "blocks/**/*.spec.ts"`, React server only, plus a 390 px touch variant per spec), and `affected-specs.mjs` mapping `apps/docs/examples/blocks/<folder>/**` and every component a block's `uses` names to `tests/browser/blocks/<block>.spec.ts`. Test: `node --test scripts/tests/` covers the new mapping (`affected("apps/docs/examples/blocks/coding-agent/mock.ts")` returns the coding spec). Expected: PASS.
- [ ] **Step 7: Docs skeleton.** Add the alias and pins to the docs app, `BlockToolbar`, `blocks/index.mdx` (what a block is, the thin rule, the two data paths, React only) and `blocks/meta.json` (`["index"]`), and put `"---Blocks---", "...blocks"` before Showcase in the docs `meta.json`. Extend `docs.test.mjs`: example imports under `examples/blocks/` may also be `ai`, `@ai-sdk/react`, `zod` and `@/components/blocks/*`; the v0 link is the only non-`/r/` external URL the toolbar builds. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Step 8: Notes.** `AGENTS.md`: a "Starter blocks" bullet (where sources live, the thin rule, the v0 payload, the Next consumer) and the two markers; `registry/README.md`: the `blocks` record, `r/v0/`, the Next consumer.
- [ ] **Step 9: v0 check (manual, signed in).** Build the hello block's v0 payload, put it at a public URL (a secret gist's raw URL, or `/r/v0/hello.json` on a preview of kindui.dev), and have a maintainer signed in to v0 open `https://v0.dev/chat/api/open?url=<that URL>`. Record in the PR and in spec D6: whether v0 imports it, whether the Step renders with our tokens (which proves the styles import), whether `app/hello/page.tsx` is kept as a route, and which Tailwind setup v0's project uses. If the page target is refused, change `v0Payload` to emit the page as `registry:component` and repeat. If v0 can't render it at all, set the toolbar to leave the v0 link out and say so in D6. Delete the gist after.
- [ ] **Step 10:** `npm run lint && npm run typecheck`, then `npm run check` once through a subagent with `KIND_FIXTURE_PORT_BASE=5600`. Expected: PASS. Commit `feat(registry): starter block groundwork`, push, open the PR.

---

### Task 2: Coding agent starter

Spec §2 row 1, D3, D4. Port 5610.

**Files:**
- Create: `apps/docs/examples/blocks/coding-agent/{page.tsx,coding-agent.tsx,mock.ts,route.ts}`, `packages/agent-ui/tests/fixtures/react/cases/coding-agent-starter.tsx`, `tests/browser/blocks/coding-agent-starter.{flow,spec}.ts`, `apps/docs/content/docs/blocks/coding-agent.mdx`
- Modify: `registry/catalog.mjs` (under `blocks-task-2`), `apps/docs/content/docs/blocks/meta.json`

**Interfaces:**
- Consumes: Task 1's `blocks` record shape, `BlockToolbar`, aliases, flow shape.
- Produces: `export function CodingAgent(props: { transport?: ChatTransport<UIMessage> }): JSX.Element` in `coding-agent.tsx` (the fixture passes `createMockTransport({ delayMs: 0 })`); `createMockTransport(options?: { delayMs?: number }): ChatTransport<UIMessage>` and `initialMessages: UIMessage[]` in `mock.ts`; `POST(request: Request): Promise<Response>` in `route.ts`.

**Layout:** one column, `max-w-3xl`, full height: the Conversation fills, the Composer sits at the bottom with Model Control and Approval Mode at its start and Context Meter at its end. No header, no sidebar.

**Script (mock):** `initialMessages` is one finished exchange (a user request, Reasoning, `run_tests` failing with one Stack Trace, a short reply). Sending any text streams: Reasoning (`running`, then done); `edit_files` with three files (File Tree, one `M`, one `A`); `run_command` with input `npm test`, then `tool-approval-request`. Approve streams the Terminal output (ANSI, exit 0) and `run_tests` all passing, then a reply. Deny streams a one-line reply and no output. A second send while streaming isn't possible (the Composer shows Stop). Context Meter's usage grows by a fixed amount per turn from the mock's `messageMetadata`.

- [ ] **Step 1: Write the flow** `tests/browser/blocks/coding-agent-starter.flow.ts`:

```ts
export async function run(page: Page) {
  await expect(page.getByRole("region", { name: /tests/i })).toContainText("1 failed"); // initial run
  await page.getByRole("textbox", { name: "Prompt" }).fill("Fix the failing test");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: "Run npm test?" })).toBeVisible();
  await expect(page.getByRole("tree", { name: "Changed files" })).toContainText("auth.ts");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("exit 0")).toBeVisible();
  await expect(page.getByRole("region", { name: /tests/i }).last()).toContainText("passed");
  // Review Focus 2 and 3: deny, then stop
  await send(page, "Run it again");
  await page.getByRole("button", { name: "Deny" }).click();
  await expect(page.getByText("Denied")).toBeVisible();
  await send(page, "Explain the fix");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByText("Stopped")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
}
```

  Names follow what each component's docs page already shows; adjust a locator only to a name the component actually renders, never by adding labels in the block for the test.
- [ ] **Step 2: Write the spec** `coding-agent-starter.spec.ts`: `?c=coding-agent-starter` at 1280 and 390 px, light and dark; runs the flow; axe with no violations; no page errors; the forced-colors check. Run `KIND_FIXTURE_PORT_BASE=5610 KIND_LAYERS=react npx playwright test --project blocks-react coding-agent`. Expected: FAIL (no case).
- [ ] **Step 3: Implement** the four files and the fixture case. The page maps tool names to components as spec D3 says; Stop needs the mock's stream to honor `abortSignal`. `route.ts` defines `run_command` (`needsApproval: true`), `run_tests` and `edit_files` with zod inputs and sample `execute` results, `model: "openai/gpt-5"`, `stopWhen: stepCountIs(8)`.
- [ ] **Step 4: Run** the spec. Expected: PASS at both widths and themes.
- [ ] **Step 5: Registry.** Add `coding-agent-starter` under its marker with `uses` exactly the components the files import. Run `npm run build:registry && npm run check:package && KIND_LAYERS=react npm run check:registry-consumers`. Expected: PASS, including the flow on the installed `/coding-agent`.
- [ ] **Step 6: Typecheck the route against the live transport** by a test that swaps the transport line as the docs say and runs `tsc` on the result (`scripts/tests/blocks.test.mjs`, `go-live types`). Expected: PASS. No model is called.
- [ ] **Steps 7–10:** the block task routine.

---

### Task 3: General agent starter

Spec §2 row 2, D3, D4. Port 5620.

**Files:**
- Create: `apps/docs/examples/blocks/general-agent/{page.tsx,general-agent.tsx,mock.ts,route.ts}`, `packages/agent-ui/tests/fixtures/react/cases/general-agent-starter.tsx`, `tests/browser/blocks/general-agent-starter.{flow,spec}.ts`, `apps/docs/content/docs/blocks/general-agent.mdx`
- Modify: `registry/catalog.mjs` (under `blocks-task-3`), `apps/docs/content/docs/blocks/meta.json`

**Interfaces:**
- Consumes: as Task 2.
- Produces: `export function GeneralAgent(props: { transport?: ChatTransport<UIMessage>; now?: string }): JSX.Element` (`now` for deterministic date groups in tests); `mock.ts` exports `createMockTransport`, `threads: Thread[]` (eight across Today, Yesterday, Previous 7 days and one pinned), `messagesFor(threadId: string): UIMessage[]`, `createShareLink(threadId: string): Promise<string>` (resolves `${location.origin}/share/${threadId}`); `route.ts` exports `POST`.

**Layout:** Sidebar (start) holding Thread List with New chat and the Thread Search trigger; the inset holds a header row with the thread title and the Share button, then the Conversation with Day Separators, Connection Status over its top edge, and the Composer with Attachments, Model Control and Approval Mode. Under `overlayBelow` the Sidebar is a drawer opened from a trigger in the header.

**Script (mock):** selecting a thread loads `messagesFor(id)` into `useChat` keyed by the thread id; sending streams a short Markdown reply (a paragraph, a list, a code block); a message with attachments gets a reply naming the files. New chat makes an empty thread that gets its title from the first message. Share Dialog's Create link calls `createShareLink`. Connection Status follows `online`/`offline` window events, Retry calls `regenerate`.

- [ ] **Step 1: Write the flow**: select the pinned thread and see its messages; open Thread Search with its trigger, type part of a title, choose it; New chat shows the empty state, send creates a thread at the top under "Today" (Review Focus 5); attach a file through the Composer and see the reply name it; open Share, choose "Anyone with the link", Create link, see the link; dispatch `offline` on `window` and see Connection Status, then `online` and see it leave.
- [ ] **Step 2: Write the spec** as Task 2's, with `now` fixed through `?now=2026-11-24T12:00:00Z`; at 390 px with touch it opens the drawer from the header trigger and Thread Search as a sheet (Review Focus 4). Run with port 5620. Expected: FAIL.
- [ ] **Step 3: Implement** the four files and the case. Threads and the share link are in-memory state in the composition, seeded from `mock.ts`.
- [ ] **Step 4: Run** the spec. Expected: PASS.
- [ ] **Step 5: Registry** as Task 2 step 5, for `general-agent-starter` and `/general-agent`.
- [ ] **Step 6:** add this block to `scripts/tests/blocks.test.mjs` `go-live types`. Expected: PASS.
- [ ] **Steps 7–10:** the block task routine.

---

### Task 4: Showcases out, changeset

Spec D1, D8. Port 5630.

**Files:**
- Delete: `apps/docs/content/docs/showcase/`, `apps/docs/examples/showcase/`
- Modify: `apps/docs/content/docs/meta.json` (drop `---Showcase---`, `...showcase`), `scripts/tests/docs.test.mjs` (drop the `showcases` section; assert `["---Blocks---", "...blocks"]` sits where it was and `blocks/meta.json` is `["index", "coding-agent", "general-agent"]`), `apps/docs/content/docs/index.mdx` and any page linking a showcase (link the blocks instead), `AGENTS.md` (the "Developer Output showcase" note says the showcases were replaced by blocks), `registry/README.md`
- Create: `.changeset/starter-blocks.md`

- [ ] **Step 1:** Update `docs.test.mjs` first. Run `node --test scripts/tests/docs.test.mjs`. Expected: FAIL (Showcase still in the nav).
- [ ] **Step 2:** Delete the showcases and fix every link to them (`grep -rn "showcase" apps/docs/content`). Run the test and `npm run build:docs && npm run check:docs`. Expected: PASS, with no broken link.
- [ ] **Step 3:** Changeset, `patch` for `@kind-ui/agent-ui`: "The registry adds `coding-agent-starter` and `general-agent-starter`, starter blocks that install a working agent screen in a Next.js app, with an Open in v0 link on their docs pages. The showcases are gone; the blocks replace them." (The package source doesn't change; the release publishes the registry.)
- [ ] **Step 4:** `npm run check` once through a subagent with port 5630. Expected: PASS. Commit `docs: replace showcases with starter blocks`, push, open the PR.

---

## Self-Review Notes

- **Spec coverage:** §1 thin rule → Global Constraints and the routine's gap note; §2 → Tasks 2, 3 (deep research deferred, no task); D1 → Task 4; D2 → Global Constraints; D3 → Tasks 2, 3 Script and Step 6; D4 → Task 1 `blockItems` test; D5 → Task 1 Step 1; D6 → Task 1 `v0Payload` test and Step 9; D7 → flows, specs and Task 1 Step 5; D8 → Task 1 Step 7 and the routine's docs step; D9 → nothing to build.
- **Names:** `blockItems`, `v0Payload`, `BlockToolbar`, `createMockTransport`, `run(page)`, `CodingAgent`, `GeneralAgent` are defined once and used with the same signatures.
- **Proportion:** four tasks; the code is four small files per block plus build and test plumbing, so the plan carries interfaces, scripts and tests, not bodies.
