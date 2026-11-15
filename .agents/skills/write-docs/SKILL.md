---
name: write-docs
description: Writes or reviews the agent-ui docs in apps/docs/content/docs (Get Started, component pages, the AI SDK page) in the site's voice. Use for new pages, prose edits, example captions and docs reviews. Pair it with the fumadocs skill, which covers the site's mechanics.
---

# Write agent-ui Docs

Write like you're explaining the component to a friend who hasn't used it yet. Say what it does, show it, then explain what happens. The [`fumadocs`](../fumadocs/SKILL.md) skill covers where files go and how examples and API tables are wired; this one covers the words.

Size the work to the request. For a sentence or a caption, read this guide and the section you're changing, check any API claim you touch, and reread the section. For a new page or a rewrite, follow the steps below. A review produces findings, a draft stays in chat, and an edit changes files. Treat existing wording as intentional unless the request calls for revising it.

## 1. Read the Page and Its Reference

Use `content/docs/components/step.mdx` as the reference for a component page. Read the page you're changing and its neighbors, so it continues what the reader already knows, and link to concepts other pages already teach instead of repeating them.

## 2. Check What the Component Does

For every behavior you describe, read the primitive in `packages/agent-ui/src/core/<name>/`, its render files and its tests. This matters most for defaults, announcements, keyboard, motion and what an agent can do. When the prose and the TSDoc disagree, fix both against the code. Don't describe planned behavior as shipped.

## 3. Write the Page

**Open with the point.** The frontmatter `description` starts with a verb and says what the reader can do: "Show what the agent did, one collapsible step at a time." The first paragraph adds when to use it, starting "Use a … to …", without repeating the description. Then the example, with a `caption` saying what to press and what happens: "Press Read the logs, or focus it and press Enter or Space, to show its details." The caption is plain text, so no Markdown in it.

**Then the usual sections**, adapted to the component, never added empty:

- **Installation:** the `shadcn add` command for each layer.
- **Composition:** a `text` tree of the parts, then a sentence on what each renders.
- **Usage:** one short subsection per behavior someone needs: the options that change it, what the component does on its own, the keys, and what it announces.
- **API Reference:** the generated props table, then **Agent**: what `createAgent` sees and the actions it can run.
- A closing `<Caption>`: "Runs in React and Web Components." and how the props map to attributes and events.

**Explain one thing at a time.**

- Use familiar words, contractions and short paragraphs. Address the reader: "Use X to…", "Pass Y when…".
- Name the part or option and say what it does. Skip marketing claims, rhetorical openings and invented scenarios.
- Explain the action before the code, and the result or a limit after it. Include defaults, timing and announcements when they change how someone uses the component.
- Use Title Case for titles and headings. Keep identifiers exact (`StepListItem`, `autoOpen`).
- Prefer periods, commas or parentheses to em dashes.
- Bold a visible label when it helps the reader find what to press. Name keys consistently: Enter, Space, Shift+Tab, arrow keys.

**Keep examples small.** The live example shows the smallest realistic use. A snippet in Usage teaches one option or composition. Include imports in complete examples, and explain code in the prose rather than in comments. Don't add examples that differ only in a visual variant.

**Keep the API reference to the component's own options.** Its descriptions come from TSDoc on the core `<Name>Options`, so write them there: what the option does, and `@default`. Don't reproduce inherited DOM props.

Never name other component libraries or reference projects. UI SDK, shadcn, Fumadocs, Next.js and the AI SDK are fine.

## 4. Read and Verify

Read the page in order and ask: can someone understand what the component is for, use the example, and tell what happens next, without an unexplained name or repeated setup? Then check the rendered page and its Markdown at `/llms.mdx/docs/components/<name>.md`, and run `npm run test:scripts`. Report what changed and what you checked, including anything you couldn't.
