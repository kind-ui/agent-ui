---
"@kind-ui/agent-ui": minor
---

Design system foundation: shared tokens and controls every component can draw on.

- New tokens: a type scale (`--kind-text-xs`, `-sm`, `-md`, `-lg`, `-xl`), which every stylesheet now sizes its text from; state colors (`--kind-color-selected`, `--kind-color-current`, `--kind-color-bubble`, `--kind-color-scrim`, `--kind-color-accent-hover`); one focus ring (`--kind-focus-ring`, `--kind-focus-ring-width`, `--kind-focus-offset`, `--kind-focus-offset-inset`); a radius scale (`--kind-radius-sm`, `-md`, `-lg`); and `--kind-control-height`, `--kind-trigger-height`, `--kind-badge-height`, `--kind-hit-area`, `--kind-popup-radius`, `--kind-shadow-popover`, `--kind-dialog-radius`, `--kind-dialog-top`, `--kind-shadow-dialog`, `--kind-tint-fill`, `--kind-tint-border` and the code surface tokens (`--kind-code-surface`, `--kind-code-radius`, `--kind-code-font-size`, `--kind-code-line-height`).
- `styles.css` adds shared control styles keyed on `data-kind-button` (ghost, `secondary`, `primary`, `danger`), `data-kind-icon-button`, `data-kind-trigger`, `data-kind-badge`, `data-kind-popup`, `data-kind-dialog`, `data-kind-dialog-title`, `data-kind-scrim` and `data-kind-code`, with a 44px hit area under a coarse pointer.
- Every focus ring is 2px of `--kind-color-ring`, at least 3:1 on every fill. Step, item, Queue and Stack Trace rows drew a 1.5px ring at half strength (1.9:1), and the internal Switch and Segmented Control drew none.
- The light `--kind-color-warning` is darker (3.8:1 on the surface, was 2.6:1), and a pending status mark's dashed ring reaches 3:1.
- Menu and list rows highlight with `--kind-color-selected` rather than the hover fill; internal menus, pickers' lists and tooltips share one popup radius and shadow, dialogs one radius, shadow, title size and scrim, and a sheet's backdrop shows in dark.
- The internal Button, Menu trigger, Toggle, Toolbar buttons and Carousel arrows are ghost controls of the shared heights; a pressed internal Toggle fills with `--kind-color-selected` instead of inverting.
- Running Step-based titles and the Thinking Indicator's label no longer shimmer: the status mark and the dots are the only loops, and `kind-shimmer` is gone.
- Generated Image no longer draws a moving field, grain or noise dissolve while it works: a flat placeholder, then the preview sharpening with progress, and the image fades in over 200 ms. Its corner label is a solid chip, without `backdrop-filter`.
- A pointer open of a `menuBase` menu (Add Menu, Settings Menu, Approval Mode, Model Control, Message's regenerate menu) on Web Components no longer highlights the first item, as in React; a keyboard open still does.
