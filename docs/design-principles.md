# Design principles

agent-ui ships parts of someone else's product. A person meets them mid-task, beside the host's own UI, while an agent streams into them. So the bar is fit and calm, not presence. These principles decide what we build and how it looks; the `impeccable`, `apple-design` and `web-interface-guidelines` skills are how we check it (see "Component task routine" in `AGENTS.md`).

## Restraint

- **Every element earns its place.** A border, badge, icon, label, divider or shadow is there because a person needs it to read or act. If removing it loses nothing, remove it. Prefer one quiet affordance over two loud ones.
- **Operate, not persuade.** Our components are tools. Hierarchy comes from type, spacing and one accent, not gradients, glows, glass or decoration. Brand lives in precise details: alignment, rhythm, consistent radii.
- **No AI tropes.** No sparkle icons, anywhere. No shimmering "magic" text, rainbow borders or pulsing gradients to say an agent is at work; a status mark and plain words do.
- **Words over ornament.** Statuses have text ("Running", "Denied", "2 of 5"), not color alone. Copy is short, specific and in sentence case.

## Motion with purpose

- Motion explains a change: something arrived, left, opened or moved. It never decorates. If a person wouldn't miss it, cut it.
- Respond at once, track input one to one, and let every transition be interrupted from where it is (`apple-design` §1–3). Entrances play once, on mount; updates never replay them.
- Durations and easings come only from the motion tokens. Every animation has a reduced form (opacity, 120 ms at most) and a `motion="none"` form (the final state at once).
- Loops (spinners, dot flow) are for waiting only, and stop the moment the wait ends.

## Stability

- **No layout shift.** Streaming text, status changes, late metadata, a button that comes or goes: nothing above or beside them moves. Reserve the space, swap in place, or grow below.
- Results collapse to a compact summary when they complete; resolved decisions keep their outcome, not their buttons.
- Follow the live edge while the reader is there, and let go the moment they scroll away.

## Light and dark, one token system

- Every color, radius and duration is a `--kind-*` token, so a host restyles us by changing tokens, not by fighting selectors. Both themes are designed, not inverted: check each component in light and dark.
- Contrast holds at 4.5:1 for text and 3:1 for marks and focus rings, in both themes and in forced colors.

## System

Each component is quiet on its own; these rules keep a page of them reading as one product: pill controls, soft elevation, concentric corners and quiet motion. The tokens live in `agent-ui.css` and the shared controls in `controls.css`; `scripts/tests/styles.test.mjs` holds the ones a check can.

- **One way to show waiting.** A task that is running shows the status mark's spinner. A reply on its way shows the dots, at one size. A pending button keeps its width and its accessible name: its label stays in the layout, drawn clear, under a 14px running mark centered on it. Never two loops for one wait, and never shimmering, pulsing or glowing text.
- **No box inside a box.** One container per object: the outer component, a standalone artifact (a document, an image, a code block) or a decision waiting on a person. Controls inside it are ghost, with no border at rest and a fill on hover and while open. Chips inside it are filled, not outlined.
- **Say a fact once.** One mark per row, plus words. Don't color the text when a colored mark sits beside it, and don't add a tinted border, a tinted fill and an icon to say the same thing.
- **Chrome on hover or focus, not on every item.** Per-item actions (copy, edit, more) show on `:hover` and `:focus-within`, and always on the last item and under `(hover: none)`. A nested block (a table in a document) defers to its parent's actions.
- **Focus rings appear only for keyboard navigation; text fields never show one.** The ring is `outline: var(--kind-focus-ring)` under `:focus-visible` only, 2px of neutral ink that follows the shape. Rows, list items, chips in a strip and anything in a scroller draw it inside (`--kind-focus-offset-inset`), where no ancestor clips it; a free-standing control draws it 2px outside. A text field, the composer included, shows its caret and changes nothing else.
- **Everything pressed is a pill.** Buttons, icon buttons, triggers, chips and badges use `--kind-radius-full`. Rows are soft rectangles. Corners nest concentrically, inner = outer − padding: rows `--kind-radius-md` (10px) in popups `--kind-popup-radius` (16px, 6px padding), cards `--kind-radius-lg` (14px), the user bubble `--kind-bubble-radius` (22px), dialogs `--kind-dialog-radius` (24px), the composer `--kind-composer-radius` (28px). Every corner but the pill follows `--kind-radius`.
- **Soft elevation, not borders.** Floating surfaces (popups, dialogs, the composer) sit on `--kind-color-raised` with their `--kind-shadow-*`, whose first layer is the 1px `--kind-color-hairline`; they draw no border. Dark surfaces lift by lightness and are neutral gray.
- **States are translucent ink.** `--kind-color-hover` is for the pointer only, `--kind-color-pressed` for `:active`, `--kind-color-selected` for the chosen item (a pressed toggle, the highlighted row, an open trigger) and `--kind-color-current` for where the person is, with `--kind-font-weight-current` and never a hue. The accent is for links, status and a host's own colored primary; the one primary action is the ink `--kind-color-primary` pill.
- **A type scale, not sizes.** The system face (`--kind-font-sans`, for hosts that want it), weights 400, 500 and 600, and a slightly tighter track from 13 to 16px: each `--kind-text-*` has a `-leading` and a `-tracking`. Controls are `md` (14/20), secondary text `sm` (13), meta and badges `xs` (12), prose and the composer `body` (16/24), dialog titles `xl` (18), an empty state's prompt `2xl` (24). Nothing smaller than 12px; mono only for literal code.
- **Sizes climb 28, 32, 36.** `--kind-control-height-sm`, `--kind-control-height` (the default) and `--kind-control-height-lg`; the composer's controls are `--kind-composer-control-height` (36). Under a coarse pointer every control's hit area is 44px.
- **Motion is short and physical, and stops.** Hover colors take `--kind-duration-fast` on `--kind-ease-in-out`. A press scales to `--kind-press-scale` in `--kind-duration-instant` and releases on `--kind-ease-spring`; a control that opens something doesn't scale. Popups enter from `--kind-enter-scale` on `--kind-ease-enter` and leave faster on `--kind-ease-exit`. Reduced motion keeps opacity only. Nothing loops but a spinner.

### Shared controls

A part opts in with an attribute its core slot writes, so both render layers draw it the same. **Shared controls own their look:** a component picks a variant or a size and may only place the control (margin, alignment, order, width); it never restyles one. When a look is missing, add a variant here.

| Attribute | Use it for |
| --- | --- |
| `data-kind-button` | A text pill: ghost by default, `="secondary"` raised with a hairline, `="soft"` on the bubble fill, `="primary"` the ink pill (one per surface), `="danger"` and `="danger-ghost"`. |
| `data-kind-icon-button` | A circle with one icon and an accessible name: copy, close, more, previous and next. |
| `data-kind-trigger` | What opens a menu, picker or popover: a ghost pill with a muted label that turns to ink on hover and while open. |
| `data-kind-size` | `="sm"` (28) or `="lg"` (36) on any of the three above; 32 by default. |
| `data-kind-badge` | A count or a short state beside a title, as a tinted pill, `="success" \| "warning" \| "danger" \| "accent"`. Beside a status mark, use words, not a badge. |
| `data-kind-popup` | A menu, list or card that floats over the page. |
| `data-kind-dialog`, `data-kind-dialog-title`, `data-kind-scrim` | A modal and what dims and blurs the page behind it; a sheet's backdrop takes the same scrim. |
| `data-kind-code` | A block of code, terminal output or a stack trace. |

Under a coarse pointer, buttons, icon buttons and triggers grow their hit area to 44px through `::before`, so don't draw on `::before` of a shared control. The user's message is a `--kind-color-bubble` fill with `--kind-bubble-radius` and `--kind-bubble-padding`; the assistant's reply is prose on the canvas, with no bubble.

## Agent-first

- Everything a person can do, an agent can do through the same component, and the snapshot names it the way a person would. A design that only works by pointer isn't done.
- Keyboard, focus, ARIA and announcements come from UI SDK. Design within them; don't paint over them.

## When not to add

Don't add a component when:

- a host can compose it from ones we ship in a few lines, or it's a layout the host's own app already owns (pages, shells, navigation chrome);
- it serves one demo or one model provider rather than a recurring agent pattern;
- it duplicates a component with a different look; extend the existing one with an option or a token instead;
- we can't yet name its streaming, approval and agent behavior. A component is its behavior; the look comes last.

Don't add an effect when:

- it signals "AI" rather than a state change;
- it animates something that didn't change, or loops while nothing is waiting;
- it needs a new token or a stronger selector to exist, or it reads in only one theme;
- it moves content the reader is looking at.

When in doubt, ship the quieter version. Adding later is cheap; taking back a look people depend on isn't.
