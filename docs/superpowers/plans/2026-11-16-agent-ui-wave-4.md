# `@kind-ui/agent-ui` Wave 4 (0.4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one stacked PR: Task 1 stacks on this plan's PR, and each later task stacks on the one before.

**Goal:** Ship Wave 4, "artifacts and developer output": Sources, Inline Citation, Document, Generated Image, File Tree, Terminal, Stack Trace, Test Results, Transcript, and Selection with Action, in React and Web Components, with registry items, docs pages, a showcase page and the 0.4.0 changeset.

**Architecture:** Every Wave 4 component is one `definePrimitive` that composes UI SDK the way Waves 1–3 do: the primitive owns options, state, announcements and agent actions, and hands a composed UI SDK component its props through slot state, or owns its popup through `createPopup` as Context Meter does. Terminal, Stack Trace, Test Results and Action spread `stepBase`. Content parsing that UI SDK doesn't cover (ANSI SGR, JavaScript stack text) goes through pinned open-source parsers behind small core modules, as the markdown engine does. File Tree and Test Results share one tree helper over UI SDK Tree.

**Tech Stack:** `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`, `motion` at `14.14.0`. New exact-pinned runtime dependencies (D2, D7): `ansi-sequence-parser@1.1.3` and `stacktrace-parser@0.1.11`, both MIT.

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §2 "Building on UI SDK" and "Internal general components", §3 dependency policy, §4.1, §5 Step base, §6 Motion and Agent actions, §7 Wave 4, §8, §10. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist) and `.agents/experts/*/decisions.md`.

## Decisions

Decided 2026-11-16, as recommended. Task 1 writes D1–D9 into spec §2, §3 and §7 before any component starts. D10 is an ordering note.

- **D1. Inline Citation's card: own popup, not Hover Card.** Spec §2 lists Hover Card. UI SDK Hover Card needs a link as its trigger, and its docs say touch and screen reader users may never open it; a citation whose source has no `url` has no link to be. Context Meter met the same problem (Wave 3 D3).
  - **Decided:** the primitive owns its card through `createPopup` with the Context Meter preset (popover plus hover and focus opening, hover card delays), which Task 1 moves into a shared `core/hover-popup.ts`. It opens on hover, focus and press, `open`/`onOpenChange` reach a web host, and the agent's `open`/`close` are direct. Spec §2's internal table and §7 say "Popover (opens on hover, focus, and press), Carousel".
- **D2. Terminal ANSI scope and parser.** Spec §7 says "an in-house parser".
  - **Decided:** parse with `ansi-sequence-parser` (MIT, no dependencies, streams across chunks) behind `core/ansi.ts`, rather than writing one. Scope: SGR only (16 named colors as `--kind-ansi-*` tokens, 256-color and truecolor as `rgb()`, bold, dim, italic, underline, strikethrough, inverse, reset). Every other escape (cursor moves, erase, OSC titles and OSC 8 links) is dropped, never shown or run. A lone `\r` rewrites its line from the start, so progress bars show their last state; `\r\n` is a newline. No HTML: spans carry text and styles only. Spec §3's dependency list and §7's Terminal line change to match.
- **D3. Generated Image progressive states.**
  - **Decided:** the host's `status: "generating" | "ready" | "error"`, with an optional `progress` (0–100) and `preview` (a partial image's URL) while generating. The component adds its own `loading` and `loaded` once the image is `ready`, from the `<img>`'s `load` and `error`, so it shows `generating`, `loading`, `loaded` and `error` (spec §7's three plus generation). The frame keeps the size from `width` and `height` (as `aspect-ratio`) in every state, so nothing moves when the image arrives. A preview shows blurred under a shimmer; reduced motion drops the shimmer and blur transition.
- **D4. Document formats.**
  - **Decided:** `format: "markdown" | "code" | "text"`: markdown through the Markdown view, code through Code Block with `language`, text as a wrapped `<pre>`. All three exist already. No HTML, PDF or image previews; a host shows those itself.
- **D5. Selection's toolbar.**
  - **Decided:** a floating internal Toolbar placed with `position` against the selection's `Range` (a virtual anchor whose rectangle UI SDK checks each frame) and registered with `bindLayer` (non-modal, `topLayer: true`) for Escape and outside press. Not `createPopup`: it needs a trigger element, and a selection has none. The primitive reads the selection on its root's `pointerup` and `keyup` (slot `on` handlers), so it needs no document listener and no spec §2 row. The toolbar never takes focus when it appears. It sits in the DOM directly after the root's content, so Tab from a keyboard selection reaches it, and the Toolbar keeps its single Tab stop and arrow keys.
- **D6. Generated Image and Document `download`.**
  - **Decided:** both offer `download` only while the host supplies `onDownload` (web: `can-download`), as spec §7 says for Document. The component never fetches or builds a blob. The docs show a short host handler.
- **D7. Stack Trace input.**
  - **Decided:** `frames: StackFrame[]` as data, so a host can pass frames from any language, or `stack: string`, parsed by `parseStack` over `stacktrace-parser` (V8, SpiderMonkey and JavaScriptCore text). Lines it can't parse stay as raw frames. A frame is a library frame when the host says so, else when its file is under `node_modules/` or starts with `node:` or `internal/`.
- **D8. Transcript search.**
  - **Decided:** `search(text)` filters to the segments that match (`fuzzyScore` over the text and speaker, above zero, in time order) and marks matches with `matchSegments` in `<mark>`, as Model Selector does. Clearing the search restores every segment and keeps focus on the segment it was on.
- **D9. Transcript following playback.**
  - **Decided:** the segment at `currentTime` gets `aria-current` and its word `data-current`. While `follow` is on (default) and focus isn't inside the transcript, a change of current segment brings it into view through the transcript's `createVirtualizer` (`scrollToIndex(index, { align: "center" })`). No hand-written scrolling.
- **D10. Version order (a note, not a decision).** `packages/agent-ui/package.json` reads `0.3.0` on `main`. Task 13's changeset lands only once the 0.3.0 release has published, or the two versions go out together; Task 13 checks and stops if neither holds.

## Global Constraints

- **Build on UI SDK (spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`, exported as `<camelCase>Primitive` with the explicit `ReturnType<typeof definePrimitive<…>>` annotation. Each render file calls `createParts` or wraps a UI SDK component. `npm run lint` runs the guard.
  - Focus, keys, roving, popups, dismissal, dialogs, trees, scrolling and announcements come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. Wave 4 needs no new spec §2 row; a task that finds it does stops and asks for a spec change.
  - A composed UI SDK component follows the Composer pattern: the slot's `state` hands its props (memoized in `api.partState`), React passes them as props, web writes them onto the `ui-*` element in the root's `render` hook. A component that owns a popup uses `createPopup` as Context Meter and Feedback do.
  - A component composes the internal wrapper (`src/{react,web}/internal/<name>`) where its look fits, else bare UI SDK parts styled from its own stylesheet. The first task to need a missing wrapper adds it in both layers and to `internals` in `registry/catalog.mjs`.
- **Read first:** the `ui-sdk` skill, `node_modules/@ui-sdk/<framework>/docs/llms.txt`, and each component page a task names. Where the installed docs differ from this plan, follow the docs and add a line to `AGENTS.md` "UI SDK API notes".
- **Names:** primitives `kind-<component>`; web tags `kind-<component>[-<part>]` in light DOM, declared in `HTMLElementTagNameMap`; React `<Name>`, `<Name><Part>`; web `define<Name>()`; registry items `<component>` and `<component>-web`. The naming option is `label`, never `title`.
- **Web:** callbacks are DOM events; a callback whose presence offers an action has a `can-<action>` attribute; a callback that names a bubbling native event inside is renamed through `events`. Web roots that bind parts reading style call `holdTransitions` (`core/step/base.ts`); Step-based ones get it from the base.
- **Agent actions (spec §6):** listed only while available, through api getters that return `undefined` otherwise; same code paths as pointer and keyboard. Callbacks report who caused them through `actionSource` or `dispatch`, so an agent's call has `details.source === "agent"`. Actions that take an id or path refuse an unknown one and list them through `agent.items` (`closed: true`). No Wave 4 action renders `data-agent-confirm`; spec §6 lists none.
- **Accessibility (spec §8):** every root with a role is named; `announce` is polite and fires on outcomes only (an exit code, a finished run, a failed image), never per chunk; every status has a mark and text.
- **Motion:** every animated primitive takes `motion: "auto" | "reduced" | "none"`; durations and easings from `src/core/motion/tokens.ts` and `--kind-duration-*`/`--kind-ease*`; `"reduced"` is at most a 120 ms opacity fade, `"none"` is instant. Popups and dialogs animate in CSS from UI SDK's `data-starting-style`/`data-ending-style`.
- **Streaming UX checklist** (`AGENTS.md`): "Live edge" for Terminal; "Mount-only pop-in" for Sources, File Tree rows and Transcript segments; "No layout shift" for Generated Image, Document and Terminal; "Compact completion" for Terminal, Test Results and Action.
- **Design bar:** light and dark through `--kind-color-*` tokens only. A part that comes and goes has a reserved place or replaces a part of the same size. Every component PR has light and dark screenshots, nothing focused unless they show focus. New glyphs are Lucide's, drawn as CSS masks with a `forced-colors` rule, and added to the Lucide entry in `THIRD_PARTY_NOTICES.md`.
- **Tests stay lean and never slow implementation:** build first, then test. Per component: core unit tests only for pure helpers, and one browser spec per layer with an `expectAgentActions` snapshot and a smoke test (renders, the keyboard path, axe in light and dark). `npm run check` runs once before push, through a subagent; so do screenshot sets and flake hunts. Fixtures and explicitly resolved deferred promises only.
- **Size:** each task adds its primitive to `imports` in `size-budget.json` at its measured gzip size rounded up to the next 500 bytes, and raises the `./core` limit by the measured growth, rounded up to the next 1,000 bytes.
- **Publication:** nothing publishes, versions or deploys.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.

## Review Focus

1. **Terminal output streamed while the reader scrolled up:** the view stays where they are, the jump control appears, and lines above don't re-render or move. Task 7.
2. **ANSI split across chunks:** `\x1b[3` in one chunk and `1mred` in the next renders "red" in red, with no stray characters, and a cursor-move sequence renders nothing. Task 1 and Task 7.
3. **A generated image that fails after `ready`:** the frame keeps its size, shows the error with its text, announces it once, and `open` isn't offered. Task 5.
4. **File Tree paths updated while a folder is open and a file focused:** the folder stays open and focus stays on the file; a removed focused file moves focus to a neighbor. Task 6.
5. **Selection that crosses the root's edge or collapses:** a selection reaching outside the root shows no toolbar; collapsing it hides the toolbar without moving focus. Task 11.

---

## File Map

```text
packages/agent-ui/src/types/records.ts                 (+ FileTreeEntry, StackFrame, TranscriptSegment, TranscriptWord, SelectionActionItem)
packages/agent-ui/src/core/{ansi,stack,tree,hover-popup}.ts
packages/agent-ui/src/core/{sources,inline-citation,document,generated-image,file-tree,terminal,stack-trace,test-results,transcript,selection,action}/{<name>,index}.ts
packages/agent-ui/src/react/<name>.tsx    packages/agent-ui/src/web/<name>.ts
packages/agent-ui/src/{react,web}/internal/tree.*      (Task 6)
packages/agent-ui/src/styles/<name>.css    src/styles/agent-ui.css (--kind-ansi-* tokens, Task 7)
packages/agent-ui/tests/core/{ansi,stack,tree}.test.mjs
packages/agent-ui/tests/fixtures/{react,web}/cases/<name>.*
tests/browser/wave-4/<name>.spec.ts
apps/docs/content/docs/components/<name>.mdx    apps/docs/examples/<name>/basic.tsx
apps/docs/content/docs/showcase/developer-output.mdx
registry/catalog.mjs    size-budget.json    AGENTS.md    .changeset/agent-ui-wave-4.md
```

## Component task routine

Tasks 2–11 each finish with these steps after their own tests pass. A task lists only what differs.

- [ ] **Registry:** add `<name>` to `components` in `registry/catalog.mjs` (title, one-line description, `uses` naming the items its render files import), and any new `internal` entry. Run `node --test scripts/tests/registry.test.mjs`. Expected: PASS.
- [ ] **Docs page:** follow `apps/docs/content/docs/components/step.mdx` (the approved template) and the `write-docs` and `fumadocs` skills: one captioned example on top, then Installation, Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`<auto-type-table>` over `Pick<<Name>Api, …>`) and the closing `<Caption>` about Web Components. Add `apps/docs/examples/<name>/basic.tsx` (starting with `"use client"` when it holds state or handlers) and the page to `components/meta.json`, after `guardrail-notice` in task order. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** light and dark screenshots of the docs example, nothing focused, into `artifacts/screenshots/<name>-{light,dark}.png`, attached to the PR with the `github-pr-media` skill. A component with a popup, dialog or toolbar adds one of it open.
- [ ] **Size:** `npm run check:size`, then set the budgets as Global Constraints say.
- [ ] **Finish:** run `unslop` on the diff, then `expert-review`, and fix its findings. Run `npm run check` once, through a subagent. Expected: PASS. Add any new UI SDK difference to `AGENTS.md` "UI SDK API notes" as one bullet named after the component, and move any `decisions.md` item the task settles to Resolved.
- [ ] **Commit and PR:** commit `feat(<name>): …`, push, and open the PR on the previous task's branch. The PR reports what was checked by hand in a real browser (keyboard, focus, reduced motion through the media query and the `motion` option, light and dark) and what wasn't.

---

### Task 1: Wave 4 groundwork

Spec §3, §7 Wave 4; decisions D1, D2, D7.

**Files:**
- Create: `packages/agent-ui/src/core/{ansi,stack,tree,hover-popup}.ts`
- Modify: `src/types/{records,index}.ts`, `src/core/context-meter/context-meter.ts` (uses `hover-popup.ts`), `src/core/index.ts`, `packages/agent-ui/package.json` (two dependencies), `package-lock.json`
- Modify: `playwright.config.mjs` (`waves` gains `wave-4`), `scripts/affected-specs.mjs` if it names waves, `scripts/check-package.mjs` if it lists allowed runtime dependencies
- Modify: spec §2 internal table, §3 dependency list, §7 Wave 4 rows and behavior lines (D1–D9)
- Test: `packages/agent-ui/tests/core/{ansi,stack,tree}.test.mjs`, existing `tests/browser/wave-3/context-meter.spec.ts`

**Interfaces:**
- `types/records.ts`:
  - `FileTreeEntry { path: string; change?: "added" | "modified" | "deleted" }` (a path ending in `/` is an empty folder, as `treeFromPaths` reads it)
  - `StackFrame { raw: string; fn?: string; file?: string; line?: number; column?: number; library?: boolean }`
  - `TranscriptWord { text: string; start: number; end: number }` (seconds)
  - `TranscriptSegment { id: string; speaker: string; start: number; end: number; text: string; words?: TranscriptWord[] }`
  - `SelectionActionItem { id: string; label: string; description?: string }`
  - `Source` and `TestSuite`/`TestCase` stay as they are.
- `core/ansi.ts` (D2):
  - `AnsiSpan { text: string; fg?: string; bg?: string; bold?: true; dim?: true; italic?: true; underline?: true; strike?: true }`: `fg`/`bg` are CSS values, `var(--kind-ansi-<name>)` for the 16 named colors (`black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white` and `bright-*`), else `rgb(r g b)`. Inverse swaps `fg` and `bg` here, with the defaults `var(--kind-color-surface)`/`var(--kind-color-fg)`.
  - `AnsiLine { spans: AnsiSpan[] }`.
  - `createAnsiLines(): { update(output: string): readonly AnsiLine[]; text(): string }`. When `output` starts with the previous one, only the appended text is parsed, carrying SGR state; otherwise it starts over. Every line but the last keeps its object identity across updates. `text()` is the output without escapes, for copy.
- `core/stack.ts` (D7): `parseStack(text: string): StackFrame[]` over `stacktrace-parser`'s `parse`, keeping each unparsed line as `{ raw }`, and `isLibraryFrame(frame: StackFrame): boolean`.
- `core/tree.ts`: `pathItems(entries: readonly FileTreeEntry[]): TreeItemData[]` (UI SDK `treeFromPaths`, values are paths) and `treeValues(items: readonly TreeItemData[]): { branches: string[]; leaves: string[] }`, used by File Tree and Test Results for `agent.items` and unknown-value refusal.
- `core/hover-popup.ts` (D1): `hoverPopupPreset: PopupPreset` and `withHover<Options extends object>(options: Options): Options` (the prototype trick Context Meter uses so web callbacks still fill in). Context Meter imports both with no change in behavior.

- [ ] **Step 1: Write the failing tests.**

```js
test("SGR split across chunks", () => {
  const lines = createAnsiLines();
  lines.update("\x1b[3");
  const [line] = lines.update("\x1b[31mred\x1b[0m ok");
  assert.deepEqual(line.spans, [{ text: "red", fg: "var(--kind-ansi-red)" }, { text: " ok" }]);
});
test("other escapes are dropped and \\r rewrites the line", () => {
  const lines = createAnsiLines();
  const out = lines.update("\x1b[2K\x1b]0;title\x07 10%\r 99%\nnext");
  assert.equal(out[0].spans.map((s) => s.text).join(""), " 99%");
  assert.equal(lines.text(), " 99%\nnext");
});
test("finished lines keep identity", () => {
  const lines = createAnsiLines();
  const first = lines.update("a\nb");
  assert.equal(lines.update("a\nbc\nd")[0], first[0]);
});
test("256 and truecolor", () => {
  const [line] = createAnsiLines().update("\x1b[38;5;196mx\x1b[48;2;1;2;3my");
  assert.equal(line.spans[0].fg, "rgb(255 0 0)");
  assert.equal(line.spans[1].bg, "rgb(1 2 3)");
});
test("parseStack keeps unparsed lines and flags library frames", () => {
  const frames = parseStack("Error: x\n    at f (/app/src/a.ts:3:5)\n    at g (/app/node_modules/lib/i.js:1:1)\nweird");
  assert.deepEqual(frames.map((f) => [f.fn, f.line, isLibraryFrame(f)]), [["f", 3, false], ["g", 1, true], [undefined, undefined, false]]);
});
test("pathItems and treeValues", () => {
  const items = pathItems([{ path: "src/a.ts", change: "added" }, { path: "README.md" }]);
  assert.deepEqual(treeValues(items), { branches: ["src"], leaves: ["src/a.ts", "README.md"] });
});
```

- [ ] **Step 2: Run** `npm run test:unit`. Expected: the new tests FAIL.
- [ ] **Step 3: Install** `npm install --save-exact -w @kind-ui/agent-ui ansi-sequence-parser@1.1.3 stacktrace-parser@0.1.11`. Check whether `ansi-sequence-parser` drops non-SGR escapes; strip what it leaves in `ansi.ts` and record which in the API notes.
- [ ] **Step 4: Implement** the interfaces; move Context Meter onto `hover-popup.ts`.
- [ ] **Step 5: Run** `npm run lint && npm run typecheck && npm run test:unit && npx playwright test tests/browser/wave-3/context-meter.spec.ts && npm run check:package && npm run check:size`. Expected: PASS; `check:package` finds no React or `ai` import with the new dependencies.
- [ ] **Step 6:** Write D1–D9 into the spec. Commit `feat: Wave 4 groundwork: ANSI, stack, tree and hover popup helpers`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 2: Sources

Spec §7 Wave 4 "Sources".

**UI SDK:** `bindStepPanel` (`bindPanel` with find in page, as Queue's sections own theirs), the motion helper's `"fade-up"` entrance.

**Files:**
- Create: `packages/agent-ui/src/core/sources/{sources,index}.ts`, `src/react/sources.tsx`, `src/web/sources.ts`, `src/styles/sources.css`
- Test: `tests/browser/wave-4/sources.spec.ts`

**Interfaces:**
- Produces `sourcesPrimitive` (`kind-sources`):
  - Options: `sources: Source[]`; `label?` (default "Used N sources", "Used 1 source"); `open`/`defaultOpen`/`onOpenChange`; `motion`.
  - Slots: `root` (`role: "region"` named by the trigger text), `trigger` (`role: "button"`, `aria-expanded`), `content` (`bindStepPanel`), `list`, `item` (prop `value`; a link when `url` is safe through the markdown engine's URL check, else text, with `title`, host name and `snippet`).
  - Sources added after the first frame play `"fade-up"` once; the count in the trigger updates without moving the row.
  - API getters `expand`/`collapse`, offered while closed and open. `controlled`: `open`. Agent actions: `expand`, `collapse`.
- React: `Sources`, `SourcesTrigger`, `SourcesContent`, `SourcesItem`. Web: `defineSources()`.

- [ ] **Step 1: Write the failing browser test**, both layers: Enter and Space toggle; find in page opens closed content; an unsafe `url` (`javascript:`) renders text, not a link; a new source fades up once and an updated one doesn't; reduced motion has no height animation; axe in light and dark; `expectAgentActions(page, "Used 3 sources", ["expand"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/sources.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Reuse Markdown's `sanitizeUri` call through the engine's exported check; if none is exported, export one from `core/markdown` rather than duplicating it.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(sources): add Sources`.

---

### Task 3: Inline Citation

Spec §7 Wave 4 "Inline Citation"; D1.

**UI SDK:** `createPopup` with `hoverPopupPreset` and `popupState`/`popupTrigger`/`popupContent` (`core.md` "A Popup of Your Own"); Carousel (`docs/components/carousel.md`, "Paging from Anywhere": `createCarouselController`) through `internal-carousel`.

**Files:**
- Create: `packages/agent-ui/src/core/inline-citation/{inline-citation,index}.ts`, `src/react/inline-citation.tsx`, `src/web/inline-citation.ts`, `src/styles/inline-citation.css`
- Test: `tests/browser/wave-4/inline-citation.spec.ts`

**Interfaces:**
- Consumes: `hoverPopupPreset`, `withHover`, `Source`.
- Produces `inlineCitationPrimitive` (`kind-inline-citation`):
  - Options: `sources: Source[]`; `label?` (the chip text, default the first source's host name, "+N" when more); `open`/`defaultOpen`/`onOpenChange`; `motion`.
  - Slots: `root` (inline, `display: inline`), `trigger` (`role: "button"`, named "Source: <title>" or "Sources: N"), `content` (the card, `initialFocus="none"` as Context Meter's), `carousel` (handed the Carousel controller through state; present only with more than one source), `item` (prop `value`), `previous`/`next` (Carousel's), `index` ("1 of 3", `aria-live="off"`).
  - The primitive owns a `createCarouselController()` and tracks the page from the Carousel's `change` bubble; `next`/`previous` page through the controller.
  - API getters: `open`/`close` (offered while closed and open), `next`/`previous` (while open with another page that way). `controlled`: `open`. Agent actions: `open`, `close`, `next`, `previous`.
- React: `InlineCitation`, `InlineCitationTrigger`, `InlineCitationContent`, `InlineCitationItem`. Web: `defineInlineCitation()`.

- [ ] **Step 1: Write the failing browser test**, both layers: the card opens on hover after the delay, on focus and on press, and Escape returns focus to the chip; with three sources, Next and Previous page and "2 of 3" updates; with one, no carousel controls render; the chip doesn't change the line height of the paragraph it sits in; axe with the card open, light and dark; `expectAgentActions(page, "Sources: 3", ["open", "press"])`, then after `act("open")`, `["close", "next", "press"]`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/inline-citation.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example places citations inside a Markdown message.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-carousel"]`). Commit `feat(inline-citation): add Inline Citation`.

---

### Task 4: Document

Spec §7 Wave 4 "Document"; D4, D6.

**UI SDK:** internal Toolbar and Menu (`docs/components/{toolbar,menu}.md`, "Menus" in Toolbar), internal Scroll Area, `bindStepPanel` for the collapsed preview; `createCopy`; Markdown view and Code Block.

**Files:**
- Create: `packages/agent-ui/src/core/document/{document,index}.ts`, `src/react/document.tsx`, `src/web/document.ts`, `src/styles/document.css`
- Test: `tests/browser/wave-4/document.spec.ts`

**Interfaces:**
- Produces `documentPrimitive` (`kind-document`):
  - Options: `label` (the title); `content: string`; `format?: "markdown" | "code" | "text"` (default `"markdown"`); `language?` (for `code`); `streaming?: boolean`; `downloads?: { id: string; label: string }[]` (more than one shows a Menu, one or none a button); `onDownload?(formatId: string | undefined, details)` (`"action"`); `onCopy?`; `open`/`defaultOpen`/`onOpenChange` (expanded past `--kind-document-max-height`); `motion`.
  - Slots: `root` (`role: "region"` named by `label`), `header`, `title`, `toolbar` (internal Toolbar), `copy` and `download` (wrapping toolbar buttons, the "wrap ours" seam Message uses), `body` (Scroll Area holding the Markdown view, a headerless Code Block, or `<pre>`), `expand` (`role: "button"`, "Show more"/"Show less", present only while the body overflows its collapsed height).
  - Copy writes `content` through `createCopy`. Streaming keeps the header still and grows only the body up to the collapsed height.
  - API: `copy`; getters `download(formatId?)` (while `onDownload` is set; refuses an unknown format), `expand`/`collapse` (while the body overflows). `controlled`: `open`. Agent actions: `copy`, `download`, `expand`, `collapse`.
- React: `Document`, `DocumentHeader`, `DocumentTitle`, `DocumentToolbar`, `DocumentCopy`, `DocumentDownload`, `DocumentBody`, `DocumentExpand`. Web: `defineDocument()`, `can-download`, events `download`, `documentcopy`.

- [ ] **Step 1: Write the failing browser test**, both layers: each format renders (a `code` document shows no Code Block header); the toolbar is one Tab stop with arrow keys; Copy writes the source and shows "Copied"; with two `downloads` the Menu lists both and `onDownload` gets the chosen id; streaming markdown grows the body without moving the header; "Show more" appears only past the collapsed height; axe in light and dark; `expectAgentActions(page, "README.md", ["copy", "download", "expand"])` with `onDownload` and an overflowing body, `["copy"]` without either.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/document.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["markdown", "code-block", "internal-toolbar", "internal-menu", "internal-scroll-area"]`). Commit `feat(document): add Document`.

---

### Task 5: Generated Image

Spec §7 Wave 4 "Generated Image"; D3, D6.

**UI SDK:** `createPopup` with `dialogPreset` (`core.md` "A Popup of Your Own", `docs/components/dialog.md` "Focus", "Animation"), `popupTitle`, `popupClose`, `popupBackdrop`; `announce`.

**Files:**
- Create: `packages/agent-ui/src/core/generated-image/{generated-image,index}.ts`, `src/react/generated-image.tsx`, `src/web/generated-image.ts`, `src/styles/generated-image.css`
- Test: `tests/browser/wave-4/generated-image.spec.ts`

**Interfaces:**
- Produces `generatedImagePrimitive` (`kind-generated-image`):
  - Options: `src?`; `alt` (required; also the dialog title); `status: "generating" | "ready" | "error"`; `progress?`; `preview?`; `width` and `height` (the frame's `aspect-ratio`); `error?: string`; `onDownload?(details)` (`"action"`); `open`/`defaultOpen`/`onOpenChange`; `motion`.
  - State: `phase: "generating" | "loading" | "loaded" | "error"`, from `status` and the `<img>`'s `load`/`error` (slot `on` handlers on the `image` slot).
  - Slots: `root` (`role: "figure"`, named by `alt`, `data-phase`), `frame` (keeps its size in every phase), `preview` (blurred, under a shimmer, `aria-hidden`), `progress` (UI SDK Progress bare parts, present while generating with `progress`), `image`, `error` (status mark and text), `trigger` (the dialog trigger over the loaded image, "View full size"), the dialog's `content`, `title`, `close`, `backdrop`, and `download` (in the dialog and beside the trigger).
  - Announcements: "Image ready" on entering `loaded`, "Image failed" on entering `error`, once each per `src`.
  - Dialog: opens from the trigger, Escape or Close closes it, focus returns to the trigger (UI SDK's dialog preset).
  - API getters: `open` (while `loaded` and closed), `close` (while open), `download` (while `onDownload` is set and `loaded`). `controlled`: `open`, `phase`. Agent actions: `open`, `close`, `download`.
- React: `GeneratedImage`, `GeneratedImageFrame`, `GeneratedImageImage`, `GeneratedImageTrigger`, `GeneratedImageDialog`, `GeneratedImageDownload`. Web: `defineGeneratedImage()`, `can-download`, event `download`.

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 3.**
  - The frame's box is the same in `generating`, `loading` and `loaded` (bounding boxes); the `preview` shows while generating and the shimmer stops under reduced motion.
  - Enter on the trigger opens the dialog with focus inside; Escape closes it and focus is back on the trigger.
  - Axe in each phase and with the dialog open, light and dark.
  - `expectAgentActions(page, "A lighthouse at dusk", ["open", "download"])` once loaded with `onDownload`; `[]` while generating.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/generated-image.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The fixture serves a PNG from the fixture server and resolves `load` through it; no network.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(generated-image): add Generated Image`.

---

### Task 6: File Tree

Spec §7 Wave 4 "File Tree".

**UI SDK:** Tree (`docs/components/tree.md`: "File Paths", "Controller", "Find in Page", "Virtualized"), whose roving focus, typeahead and expand keys are UI SDK's. Adds `internal-tree`.

**Files:**
- Create: `packages/agent-ui/src/core/file-tree/{file-tree,index}.ts`, `src/react/file-tree.tsx`, `src/web/file-tree.ts`, `src/styles/file-tree.css`, `src/{react,web}/internal/tree.*`
- Test: `tests/browser/wave-4/file-tree.spec.ts`

**Interfaces:**
- Consumes: `pathItems`, `treeValues`, `FileTreeEntry`.
- Produces `fileTreePrimitive` (`kind-file-tree`):
  - Options: `entries: FileTreeEntry[]`; `label` (default "Files"); `value`/`defaultValue`/`onValueChange` (selected path); `onSelect?(path, details)` (the Tree's `onAction`, Enter or press on a file); `expanded`/`defaultExpanded`/`onExpandedChange`; `motion`.
  - The primitive owns a `createTreeController()` handed to the Tree through the root slot's state, and hears the Tree's changes through the native events it fires (as Model Selector hears Combobox's `change`); it doesn't mirror the Tree's focus.
  - Each item renders its file or folder glyph, name and a change badge (`A`, `M`, `D` with the words "added", "modified", "deleted" for assistive technology). A folder shows the most significant change inside it as a dot. Rows added after the first frame play `"fade"` once.
  - API: `expand(path)`, `collapse(path)` (branches only; `false` for an unknown path), getter `select(path)` (offered while `onSelect` is set; files only). `controlled`: `value`, `expanded`. Agent actions: `expand`, `collapse`, `select`, with `agent.items` from `treeValues`.
- React: `FileTree` (+ `FileTreeItem`, `FileTreeBadge`). Web: `defineFileTree()`, `can-select`, event `select` renamed `fileselect` (native `select` bubbles from inputs).

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 4.**
  - Arrow keys, Home and End, Right and Left, and typing a name move focus (UI SDK's keys); Enter on a file calls `onSelect` with `source: "item-press"`.
  - Badges read "added"/"modified"/"deleted" in the accessibility tree; folders sort before files.
  - Axe in light and dark. `expectAgentActions(page, "Files", ["expand", "collapse", "select"])`; `act("expand", "nope")` returns false and changes nothing.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/file-tree.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-tree"]`). Commit `feat(file-tree): add File Tree`.

---

### Task 7: Terminal

Spec §5, §7 Wave 4 "Terminal"; D2.

**UI SDK:** `stepBase`; `createStickToBottom` and `createVirtualizer` on its own viewport slot, as Conversation owns its viewport (not the internal Scroll Area's, which would be a second follower); `createCopy`.

**Files:**
- Create: `packages/agent-ui/src/core/terminal/{terminal,index}.ts`, `src/react/terminal.tsx`, `src/web/terminal.ts`, `src/styles/terminal.css`
- Modify: `src/styles/agent-ui.css` (`--kind-ansi-*` as `light-dark()` pairs in `@theme default`), `scripts/tests/styles.test.mjs` if it lists tokens
- Test: `tests/browser/wave-4/terminal.spec.ts`

**Interfaces:**
- Consumes: `stepBase`, `createAnsiLines`, `createCopy`.
- Produces `terminalPrimitive` (`kind-terminal`):
  - Options: the Step base's (`status`, `label` default the command, `open`, `autoOpen`, `motion`), plus `command: string`, `output: string`, `exitCode?: number`, `onCopy?`.
  - State: `lines` from `createAnsiLines` (via `onOptions`, as Streaming Text reads `text`), `following`, `exitCode`.
  - Slots: the base's, plus `command` (prompt and command, `$ ` drawn by CSS), `viewport` (`focus: "tab-stop"`, `role: "log"`, `aria-live="off"`, named "<command> output", `createStickToBottom`, `createVirtualizer` keyed by line index), `line` (prop `index`; spans with `style` color and `data-*` for weight and decoration), `jump` ("Jump to latest", present while not following), `exit` (status mark and "Exit 0"/"Exit 1", present when `exitCode` is set), `copy`.
  - Announcement: the base's on completion, with "exit code N" when non-zero. No announcement per line.
  - Completion: on `complete` the base closes the step to its compact header (command, exit, duration).
  - API: `copy` (the escape-free output), getters `expand`/`collapse` from the base. `controlled`: `open`, `status`, `following`. Agent actions: `expand`, `collapse`, `copy`.
- React: `Terminal` (+ `TerminalCommand`, `TerminalOutput`, `TerminalLine`, `TerminalJump`, `TerminalExit`, `TerminalCopy`). Web: `defineTerminal()`, event `terminalcopy`.

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 1, 2.**
  - Streaming 2,000 lines at the end keeps the last line in view, and only the last line's element changes per chunk.
  - Colors read their tokens in light and dark (computed `color` of a red span differs between schemes).
  - Exit 1 shows "Exit 1" with the error mark and the step stays open; Exit 0 collapses it.
  - Axe in light and dark. `expectAgentActions(page, "npm test", ["collapse", "copy", "press"])` while open.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/terminal.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the Terminal case to `tests/browser/wave-1/budgets.spec.ts` at 10 and 500 lines: per appended chunk, React renders one line part and web re-reads one line part.
- [ ] **Step 4: Run** the same, plus the budgets spec and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(terminal): add Terminal`.

---

### Task 8: Stack Trace

Spec §5, §7 Wave 4 "Stack Trace"; D7.

**UI SDK:** `stepBase`, `createListFocus` (one Tab stop over frames, `createRovingFocus` inside), `bindStepPanel` for the library-frame groups, `createCopy`, `actionSource`.

**Files:**
- Create: `packages/agent-ui/src/core/stack-trace/{stack-trace,index}.ts`, `src/react/stack-trace.tsx`, `src/web/stack-trace.ts`, `src/styles/stack-trace.css`
- Test: `tests/browser/wave-4/stack-trace.spec.ts`

**Interfaces:**
- Consumes: `stepBase`, `parseStack`, `isLibraryFrame`, `StackFrame`.
- Produces `stackTracePrimitive` (`kind-stack-trace`):
  - Options: the Step base's (status defaults to `error`, `label` default the error's first line), plus `message?: string`, `frames?: StackFrame[]` or `stack?: string`, `showLibraryFrames`/`defaultShowLibraryFrames`/`onShowLibraryFramesChange`, `onOpenFrame?(index, frame, details)`, `onCopy?`.
  - Frames show function, file (shortened to its last two segments, full path in its name) and `line:column`. Consecutive library frames fold into one row, "N library frames", that opens in place.
  - Slots: the base's, plus `message`, `list` (`role: "list"`), `frame` (prop `value` = index; `role: "listitem"`, roving; a `button` when `onOpenFrame` is set), `library` (a folded group's toggle, `role: "button"`, `aria-expanded`), `copy`.
  - API: `copy` (message and raw frames), `toggleLibraryFrames`, getter `openFrame(index)` (while `onOpenFrame` is set; refuses an index out of range). `controlled`: `open`, `showLibraryFrames`. Agent actions: `copy`, `toggleLibraryFrames`, `openFrame`, plus the base's `expand`, `collapse`.
- React: `StackTrace` (+ `StackTraceMessage`, `StackTraceFrame`, `StackTraceLibrary`, `StackTraceCopy`). Web: `defineStackTrace()`, `can-open-frame`, events `openframe`, `stackcopy`.

- [ ] **Step 1: Write the failing browser test**, both layers: library frames start folded and "Show library frames" unfolds them all; arrow keys move between frames, Enter opens one through `onOpenFrame` with its index; a `stack` string and the same `frames` render alike; axe in light and dark; `expectAgentActions(page, "TypeError: x is undefined", ["collapse", "copy", "toggleLibraryFrames", "openFrame", "press"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/stack-trace.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(stack-trace): add Stack Trace`.

---

### Task 9: Test Results

Spec §5, §7 Wave 4 "Test Results".

**UI SDK:** `stepBase`; internal Tree (Task 6) with a `createTreeController()`; internal Segmented Control for the filter (`createSegmentedControlController`, as Reasoning Effort); Stack Trace for failures.

**Files:**
- Create: `packages/agent-ui/src/core/test-results/{test-results,summary,index}.ts`, `src/react/test-results.tsx`, `src/web/test-results.ts`, `src/styles/test-results.css`
- Test: `packages/agent-ui/tests/core/test-results.test.mjs`, `tests/browser/wave-4/test-results.spec.ts`

**Interfaces:**
- Consumes: `stepBase`, `treeValues`, Stack Trace, `TestSuite`.
- Produces in `summary.ts`: `testCounts(suites): { pass: number; fail: number; skip: number; total: number }` and `testItems(suites, filter: "all" | "pass" | "fail" | "skip"): TreeItemData[]` (suites as branches, values `suiteId` and `suiteId/testId`, suites with no matching test left out).
- Produces `testResultsPrimitive` (`kind-test-results`):
  - Options: the Step base's (`status` defaults to `error` with any failure, else `complete`; `label` default "Tests"), plus `suites: TestSuite[]`, `filter`/`defaultFilter`/`onFilterChange`, `expanded`/`defaultExpanded`/`onExpandedChange` (failing suites expanded by default).
  - Meta: "12 passed, 1 failed, 2 skipped" with a mark per count; the header keeps its size as counts change.
  - A failed test's row opens to its message and a Stack Trace from `error.stack` (`autoOpen: "never"`, open).
  - API: `setFilter(status)` (`false` for an unknown one), and `expand(id?)`/`collapse(id?)`, which replace the base's: with an id they open or close that suite (`false` for an unknown id), without one the step. `controlled`: `open`, `status`, `filter`, `expanded`. Agent actions: `setFilter`, `expand`, `collapse`, with `agent.items` from `treeValues`.
- React: `TestResults` (+ `TestResultsFilter`, `TestResultsTree`, `TestResultsCase`). Web: `defineTestResults()`, events `filterchange`, `expandedchange`.

- [ ] **Step 1: Write the failing tests.** Core: `testCounts` and `testItems` for each filter, including a suite with no tests. Browser, both layers: the filter's arrow keys switch the tree; a failure's stack trace is one Tab stop inside the tree's row; on completion the step collapses to its counts; `act("expand", "auth")` opens that suite and `act("collapse")` closes the step; axe in light and dark; `expectAgentActions(page, "Tests", ["setFilter", "expand", "collapse", "press"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-4/test-results.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Record the `expand(id?)` shape in the API notes.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["stack-trace", "internal-tree", "internal-segmented-control"]`). Commit `feat(test-results): add Test Results`.

---

### Task 10: Transcript

Spec §7 Wave 4 "Transcript"; D8, D9.

**UI SDK:** `createListFocus` over segments, `createVirtualizer` (`scrollToIndex`), `fuzzyScore` and `matchSegments` (`core.md` "Rank What Someone Searches For", "Highlight What Matched"), `actionSource`.

**Files:**
- Create: `packages/agent-ui/src/core/transcript/{transcript,search,index}.ts`, `src/react/transcript.tsx`, `src/web/transcript.ts`, `src/styles/transcript.css`
- Test: `packages/agent-ui/tests/core/transcript.test.mjs`, `tests/browser/wave-4/transcript.spec.ts`

**Interfaces:**
- Produces in `search.ts`: `searchSegments(segments, query): { id: string; text: MatchSegment[] }[]` (D8) and `currentAt(segments, time): { segment?: string; word?: number }` (binary search by `start`; a gap between segments has none).
- Produces `transcriptPrimitive` (`kind-transcript`):
  - Options: `segments: TranscriptSegment[]`; `label` (default "Transcript"); `currentTime?: number`; `onSeek?(time, details)`; `query`/`defaultQuery`/`onQueryChange`; `follow?: boolean` (default `true`); `locale?` (time format, as Context Meter reads `pageLocale`).
  - Slots: `root` (`role: "region"`), `search` (a native search input, labelled "Search transcript"), `count` ("3 matches", which `announce` reads once the query settles), `viewport`, `list` (`role: "list"`), `segment` (prop `value`; `listitem`, roving; `aria-current` when current), `speaker`, `time` (a `button` "Seek to 1:23" when `onSeek` is set, else text), `word` (prop index; `data-current`).
  - Segments added after the first frame fade in once; streaming more segments keeps the reader's place.
  - API: `search(text)`, getter `seek(segmentId)` (while `onSeek` is set; calls it with the segment's `start`; refuses an unknown id). `controlled`: `query`. Agent actions: `search`, `seek`, with `agent.items` from segments (`value` id, `label` "speaker, time").
- React: `Transcript` (+ `TranscriptSearch`, `TranscriptSegment`, `TranscriptTime`, `TranscriptWord`). Web: `defineTranscript()`, `can-seek`, events `seek`, `querychange`.

- [ ] **Step 1: Write the failing tests.** Core: `searchSegments` drops zero scores and keeps time order; `currentAt` at a segment's start, inside a word, and in a gap. Browser, both layers: typing filters and marks matches, clearing restores every segment; arrow keys move between segments and Enter on a time seeks; a `currentTime` change moves `aria-current` and, with focus outside, brings the segment into view, but not with focus inside; axe in light and dark; `expectAgentActions(page, "Transcript", ["search", "seek"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-4/transcript.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(transcript): add Transcript`.

---

### Task 11: Selection and Action

Spec §5, §7 Wave 4 "Selection + Action"; D5.

**UI SDK:** `position` with a virtual anchor and `bindLayer` (`core.md` "Placing a Popup", "Layers of Your Own"); internal Toolbar; `actionSource`. Action: `stepBase`.

**Files:**
- Create: `packages/agent-ui/src/core/{selection,action}/{<name>,index}.ts`, `src/react/{selection,action}.tsx`, `src/web/{selection,action}.ts`, `src/styles/{selection,action}.css`
- Test: `tests/browser/wave-4/{selection,action}.spec.ts`

**Interfaces:**
- Produces `selectionPrimitive` (`kind-selection`):
  - Options: `actions: SelectionActionItem[]`; `label` (default "Selection actions", the toolbar's name); `onAction?(actionId, selection: { text: string }, details)` (`"action"`); `onDismiss?`; `motion`.
  - State: `text` (the selected text, while a selection lies wholly inside the content slot and isn't collapsed), `open`.
  - Slots: `root`; `content` (the host's text; `on.pointerup` and `on.keyup` read the selection); `toolbar` (internal Toolbar, present while `open`; `bind` calls `position(() => range, el, { side: "top" })` and `bindLayer(el, { topLayer: true, onDismiss })`); `item` (prop `value`; a toolbar button).
  - Escape and an outside press dismiss the toolbar and keep the selection; a collapsed selection hides it. The toolbar never takes focus when it opens.
  - API: getters `run(actionId)` (while open and `onAction` is set; refuses an unknown id), `dismiss` (while open). `controlled`: `open`, `text`. Agent actions: `run`, `dismiss`, with `agent.items` from `actions`.
- Produces `actionPrimitive` (`kind-action`): spreads `stepBase`; options add `quote?: string` (the selected text, shown as a blockquote) and `result?: string` (markdown, through the Markdown view, `streaming` while `running`). Completion collapses it to its header. Agent actions: the base's `expand`, `collapse`.
- React: `Selection`, `SelectionContent`, `SelectionToolbar`, `SelectionItem`; `Action` (+ `ActionQuote`, `ActionResult`). Web: `defineSelection()`, `defineAction()`, `can-run`, events `selectionaction`, `dismiss`.

- [ ] **Step 1: Write the failing browser tests**, both layers:
  - **Review Focus 5.**
  - Selecting text with the mouse shows the toolbar above it without moving focus.
  - Keyboard path: the test places a selection with `Selection.setBaseAndExtent` and extends it with Shift+ArrowRight; the toolbar shows, Tab reaches it, and arrows move within it. Record what Firefox and WebKit do with Tab from a selection.
  - Choosing an item calls `onAction` with the text and `source: "item-press"`; the toolbar follows the selection when the page scrolls.
  - Action streams its result and collapses on completion; reduced motion has no slide.
  - Axe with the toolbar open, light and dark. `expectAgentActions(page, "Selection actions", ["run", "dismiss"])` while open; Action's `["collapse", "press"]` while open.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/selection.spec.ts tests/browser/wave-4/action.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** If `position` can't take a `Range` getter on web or React as the docs say, record it and anchor to the range's rectangle as a point.
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine**, once per component: two pages and four registry items in one PR (`selection` uses `internal-toolbar`; `action` uses `markdown`). Commit `feat: add Selection and Action`.

---

### Task 12: Wave 4 agent conformance

Spec §6 "Agent actions", §10 "Agent actions". Each component's snapshot is tested in its task; this task covers what they share, as Wave 3 Task 11 did.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*` (a `case=wave-4` page: the Wave 3 page plus every Wave 4 component)
- Test: `tests/browser/wave-4/agent.spec.ts` (through `tests/browser/agent-conformance.ts`)

- [ ] **Step 1: Write the test**, both layers:
  - The snapshot lists every Wave 4 component by its accessible name, and none renders `data-agent-confirm`.
  - Each Wave 4 action but the bridge's generic `press` runs once through `act` and once through a person's input on a fresh page; attributes and text match, apart from inline styles, `tabindex` and popups the person opened on the way (`ignore`).
  - Callbacks receive `details.source === "agent"`, and a cancelling change callback leaves the state unchanged.
  - Actions that take an id refuse an unknown one; on web, every `can-*` attribute adds and removes its action.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-4/agent.spec.ts`. Expected: PASS; fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add Wave 4 agent conformance`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 13: Developer Output showcase, docs index and the 0.4.0 changeset

Spec §7 (a showcase page per wave), §9.1, §9.5; D10.

**Files:**
- Create: `apps/docs/content/docs/showcase/developer-output.mdx`, `apps/docs/examples/showcase/developer-output.tsx`, `.changeset/agent-ui-wave-4.md`
- Modify: `apps/docs/content/docs/showcase/meta.json`, `apps/docs/content/docs/index.mdx`, `packages/agent-ui/README.md` (component list), `scripts/tests/docs.test.mjs`

**Interfaces:**
- The showcase plays one scripted run on a Replay button: an answer with Inline Citations and Sources; a Document the agent wrote; a File Tree of the files it changed; a Terminal running the tests in color with Test Results under it, one failure opening its Stack Trace; a Generated Image going from generating to loaded; a Transcript of a recorded call with a scrubber driving `currentTime`; and text in the answer with a Selection toolbar whose "Explain" adds an Action.
- `.changeset/agent-ui-wave-4.md`: `"@kind-ui/agent-ui": minor`, listing the eleven components and the two new dependencies.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: the Showcase section lists `agent-activity`, `human-input`, then `developer-output`, and the page holds one `<Example>`.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, in the site's voice (`write-docs`). The docs index gains the Wave 4 components.
- [ ] **Step 4: D10.** Add the changeset only once 0.3.0 has published (`npm view @kind-ui/agent-ui@0.3.0 version` prints it) or the maintainer has said both go out together. If neither, stop and report.
- [ ] **Step 5: Run** `npm run build:docs`, then `npm run check` through a subagent. Expected: PASS; `check:registry-consumers` installs every visible React item and its web twin.
- [ ] **Step 6:** Light and dark screenshots of the showcase. Run `unslop` and `expert-review`. Commit `docs: add the Wave 4 showcase and changeset`, push, open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file | Guard in `npm run lint`, every task |
| Trees, dialogs, carousels, toolbars and menus are UI SDK components | Tree (Tasks 6, 9), dialog preset (Task 5), Carousel (Task 3), Toolbar and Menu (Tasks 4, 11), Segmented Control (Task 9) |
| Popups and floating layers come from `@ui-sdk/core` | `createPopup` (Tasks 3, 5), `position` and `bindLayer` (Task 11) |
| Following, long lists and search come from `@ui-sdk/core` | `createStickToBottom` and `createVirtualizer` (Tasks 7, 10), `fuzzyScore` and `matchSegments` (Task 10) |
| Parsing reuses open source | `ansi-sequence-parser`, `stacktrace-parser`, `treeFromPaths` (Task 1) |
| Every component is a live UI SDK primitive with its actions | `expectAgentActions` in Tasks 2–11, and Task 12 |
| Hand-written code only for spec §2 rows | No new row |

## Self-Review Notes

- **Spec coverage:** §7 Wave 4 rows and behavior lines: Tasks 2–11 (Document `download` and Generated Image states D3 and D6; File Tree badges and `onSelect`; Terminal ANSI, following and exit code; Stack Trace folded library frames and `onOpenFrame`; Test Results counts and embedded Stack Trace; Transcript speakers, times, words and `onSeek`; Selection's dismissal). §5 Step base: Tasks 7–9, 11. §6 Motion and Agent actions: every task and Task 12. §8: axe, keyboard and announcement checks per task. §9.1, §9.5: Task 13 and each docs page. §10 "ANSI parsing": Task 1.
- **Out of scope:** OSC 8 links and cursor movement in Terminal (D2); HTML and PDF previews in Document (D4); a built-in download or fetch (D6); non-JavaScript stack parsing (D7); open `decisions.md` items no Wave 4 component reaches.
