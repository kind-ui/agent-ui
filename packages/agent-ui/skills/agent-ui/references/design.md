# Design

Agent UI sits inside someone else's product, beside the host's own UI, while an agent streams into it. It aims to be calm and to fit. Keep that when you compose and theme it.

## Theme with tokens

The styles declare every value as a `--kind-*` token under Tailwind's `@theme default`, so your own `@theme` or `:root` values win. Change tokens, not the components' classes:

```css
@import "tailwindcss";
@import "@kind-ui/agent-ui/styles.css";

:root {
  color-scheme: light dark;
  --kind-color-accent: var(--color-violet-600);
  --kind-radius: 0.5rem;
}
```

| Token | Use |
| --- | --- |
| `--kind-color-fg`, `--kind-color-muted` | Text and secondary text |
| `--kind-color-surface`, `--kind-color-raised`, `--kind-color-border`, `--kind-color-hairline` | The canvas, floating surfaces (popups, dialogs, the composer), borders and their 1px edge |
| `--kind-color-hover`, `--kind-color-pressed`, `--kind-color-selected`, `--kind-color-current` | Translucent state fills |
| `--kind-color-primary` | The ink of the one primary action |
| `--kind-color-accent`, `--kind-color-on-accent` | Links, running states and text on them |
| `--kind-color-success`, `--kind-color-warning`, `--kind-color-danger`, `--kind-color-on-status`, `--kind-color-on-warning` | Statuses and the marks on them |
| `--kind-radius` | The base radius; every other corner but the pill scales from it, so `0` squares them all |
| `--kind-font-sans`, `--kind-font-mono` | Text and code |
| `--kind-text-xs` … `--kind-text-2xl` | The type scale, each with `-leading` and `-tracking` |
| `--kind-ansi-*` | Terminal's 16 ANSI colors |
| `--kind-status-mark-size` | The status mark (16px; even pixels only) |

- **Dark mode** follows `color-scheme`: every color is a `light-dark()` pair. Set `color-scheme: light dark` to follow the system, or `color-scheme: dark` on the root of a class-based dark theme. Don't redefine every color for dark.
- **Shadow DOM:** Tailwind writes the defaults on `:root, :host`, so set your values on `:host` too.
- If the build lowers `light-dark()` (Lightning CSS), declare `color-scheme` in a stylesheet it compiles.
- The full list is in `node_modules/@kind-ui/agent-ui/dist/styles/agent-ui.css`.

## Shared controls

Buttons, icon buttons, menu triggers, badges, popups and dialogs share one look through attributes: `data-kind-button` (`="primary"`, `"secondary"`, `"soft"`, `"danger"`, `"danger-ghost"`), `data-kind-icon-button`, `data-kind-trigger`, `data-kind-size` (`"sm"` 28px, default 32px, `"lg"` 36px), `data-kind-badge`, `data-kind-popup` and `data-kind-dialog`. Use them on your own controls that sit beside Agent UI's, so the page reads as one product:

```tsx
<button type="button" data-kind-icon-button="" aria-label="Find in chat" onClick={openSearch}>
  <SearchIcon aria-hidden="true" />
</button>
```

- Everything pressed is a pill. Rows are soft rectangles, and corners nest concentrically.
- Floating surfaces sit on `--kind-color-raised` with a soft shadow, not a border.
- One primary action per surface. Controls inside a component are ghost.
- Don't restyle a shared control or a component's parts with new colors, borders or radii. Change the token or place the control (margin, width, order).

## Focus rings

- A control shows its 2px `--kind-focus-ring` only for keyboard focus (`:focus-visible`). A click or tap shows none.
- A text field never shows a ring: the composer's editor, the search fields, the reason boxes and the rename field show only their caret.
- If the app has a global focus rule, leave editable elements out of it, since the composer's editor is a `contenteditable`, not an `input`:

  ```css
  :focus-visible:not(input, textarea, [contenteditable]) {
    outline: 2px solid currentColor;
  }
  ```

- Never `outline: none` or `outline-none` on a component's controls; that removes keyboard focus too.

## Behavior comes with the component

Focus, keys, popups, dismissal, scroll following, announcements and ARIA come from UI SDK through each component. Don't add `role`, `tabIndex`, `aria-*` state, `onKeyDown` handlers, focus traps or scroll code to Agent UI parts. If a behavior is missing, look for the component or option that has it before writing any.

## What not to add

- **No sparkle icons**, anywhere: not as an icon, an emoji or a "magic" button. No shimmering text, glowing or rainbow borders, or pulsing gradients to say the agent is working. A status mark and plain words do.
- **One way to show waiting:** a running step's status mark, the dots for a reply on its way, a pending button's own mark. Never two loops for one wait.
- **No box inside a box.** One container per object; controls and chips inside it are ghost or filled, not outlined.
- **Words over color.** Statuses have text ("Running", "Denied", "2 of 5").
- **No layout shift.** Reserve the space for things that arrive while a person is reading.
- **Motion explains a change.** Most components take a `motion` option (`"auto"`, `"reduced"`, `"none"`) and follows `prefers-reduced-motion`. Don't add entrance animations to rows the components already animate.
