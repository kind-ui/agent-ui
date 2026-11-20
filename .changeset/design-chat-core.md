---
"@kind-ui/agent-ui": minor
---

Chat core on the shared design system.

- Editing a user message keeps the bubble's place, alignment and fill, and shows **Cancel** and **Save** in place of the toolbar. Tab moves from the text to them without saving. React `MessageEditor` renders the new `MessageEditActions` (`MessageEditCancel`, `MessageEditSave`) after the text area unless you pass children; on Web Components an editor gets a `kind-message-edit-actions` after it unless you write one.
- A message that isn't the last shows its toolbar on hover or while focus is inside it; the last message, every message on a touch screen, and any branch switcher always show.
- The user bubble fills with `--kind-color-bubble`, so it reads in dark.
- Message's Retry and Continue, Conversation's Retry and the Composer's Discard are the shared button (`data-kind-button`). Conversation's error shows a status mark in a new `error-icon` part (`ConversationErrorIcon`), then its words and Retry on one line, as a failed message does.
- Conversation's loading skeleton draws a user's bubble, an answer's lines of text (no bubble), then another bubble, so nothing changes shape when the messages load.
- Suggestion takes `layout="wrap"`, which wraps its chips onto more lines without a Carousel, for an empty conversation's starter prompts. Every chip is one filled, borderless pill, with a description after its label on the same line. React adds `SuggestionChip`, which `SuggestionItem` now wraps in its Carousel slide.
- The Composer's focus is its border taking the ring's color, without the halo. While Dictation listens in a Composer whose controls wrap, its Cancel, status and Stop sit on the actions row's last line beside Send, and the status spans the controls it hides.
- Markdown sets body text at a 1.6 line height (was 1.7), h3 at 1.125em, h4 to h6 in the muted color, inline code on a tint of the text rather than the hover fill, and a blockquote's text in the text color.
- Streaming Text's caret is a 2px bar at 60% of the text color, held still while text arrives; it pulses once the text stops for a moment.
- The internal `KindFileInputTrigger` is a ghost button of the shared control height, and `KindScrollAreaScrollToEnd` is that height with the popup shadow.
