---
"@kind-ui/agent-ui": minor
---

Composer controls and menus on the shared system: one ghost trigger, one popup surface and a menu label column.

- Add Menu, Settings Menu, Approval Mode, Model Control, Picker, Model Selector and Context Meter triggers are the shared `data-kind-trigger`: ghost, 32px, filled while open. Their popups are `data-kind-popup`. Menu group labels and plain rows like "More models" start at the item text's column.
- Model Control lists the models and effort levels in its menu itself, with no Model or Effort submenus: choosing either takes one press after opening, and the menu stays open. The host's choices follow, then its toggles. A model without effort levels keeps the Effort section, every level dimmed. Its `getItems()` data has a group, not a submenu, for each.
- Approval Mode marks a risky mode once: "Risky" in the danger color, with the label in the text color and no warning mark in the row (the trigger keeps its mark). Learn more moves after the modes, behind a separator, so opening the menu with a key lands on the first mode.
- Picker and Model Selector triggers size to their label: `--kind-picker-trigger-width` and `--kind-model-selector-width` now set the widest width (14rem by default), not a fixed one. In a composer under 28rem, a Model Selector whose model has an icon shows only the icon. A disabled row keeps its reason readable, and the default placeholders are "Search…" and "Search models…".
- Reasoning Effort shows its chosen level before UI SDK measures it, and its levels read at 14px.
- Context Bar chips and "+N" are filled, without a border; an overflow row's remove button shows on hover and focus, and always on touch screens.
- Context Meter's ring has a visible track, so a part-full meter reads as a gauge, and its description shows only the counts ("57,600 of 128,000 tokens"): its render function gets `countText` instead of `valueText`.
- Feedback's comment box asks "What went well…" after a thumbs up and "What could be better…" after a thumbs down. The box's title is visually hidden, still naming it, and the text box is named "Comment". `FeedbackCommentText`'s render function receives `placeholder` and `aria-label`.
- Dictation's Stop is filled with the text color everywhere, its Start, Stop and Cancel are ghost icon buttons, and under reduced motion only the newest 16 bars hold still over the dotted baseline.
