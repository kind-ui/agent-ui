---
"@kind-ui/agent-ui": minor
---

Chat core on the shared design system.

- Editing a user message keeps the bubble's place, shape and type, and shows **Cancel** and **Save** in place of the toolbar. Tab moves from the text to them without saving, and focus returns to Edit afterwards. React `MessageEditor` renders the new `MessageEditActions` (`MessageEditCancel`, `MessageEditSave`) after the text area unless you pass children; on Web Components an editor gets a `kind-message-edit-actions` after it unless you write one.
- A message that isn't the last shows its toolbar on hover or while focus is inside it; the last message, every message on a touch screen, and any branch switcher always show.
- The user bubble is the `--kind-color-bubble` fill with `--kind-bubble-radius` and `--kind-bubble-padding` at the body size (16/24); the branch arrows are shared icon buttons.
- Message's Retry and Continue, Conversation's Retry and jump control, and the Composer's Discard are shared buttons (`data-kind-button`). Conversation's error shows a status mark in a new `error-icon` part (`ConversationErrorIcon`), then its words and Retry on one line, as a failed message does. Its empty title is `--kind-text-2xl`.
- Conversation's loading skeleton draws a user's bubble, an answer's lines of text (no bubble), then another bubble, and no longer pulses.
- Suggestion takes `layout="wrap"`, which wraps its chips onto more lines without a Carousel, for an empty conversation's starter prompts. Every chip is the shared soft pill (`data-kind-button="soft"`, a size up when wrapped), with a description after its label on the same line. React adds `SuggestionChip` (`SuggestionChipProps`), which `SuggestionItem` now wraps in its Carousel slide.
- The Composer is a raised slab with `--kind-composer-radius` and `--kind-shadow-composer` and no border; focus changes nothing on it, and dragging files turns its hairline to the accent. Its editor is the body size, Attach, Send and Stop are 36px circles, and Send is the ink primary, faded while there's nothing to send. While Dictation listens in a Composer whose controls wrap, its Cancel, status and Stop sit on the actions row's last line beside Send.
- Markdown sets body text at the body size (16/24 by default, through `--kind-markdown-font-size`, `--kind-markdown-line-height` and the new `--kind-markdown-tracking`), h3 at 1.125em, h4 to h6 in the muted color, inline code on a tint of the text rather than the hover fill, and a blockquote's text in the text color.
- Streaming Text's caret is a 2px bar at 60% of the text color, and holds still.
