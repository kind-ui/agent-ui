---
"@kind-ui/agent-ui": minor
---

Developer output on the shared design system: Terminal, Stack Trace, Test Results, File Tree, Document, Generated Image, Transcript, Selection, Sources, Inline Citation, Code Block and Markdown Table draw with the shared code surface, buttons, icon buttons, badges and popup.

- **Breaking (Test Results):** the filter is the header's counts, each a toggle button (React `TestResultsCount`, web `kind-test-results-count`) that shows only its tests and, pressed again, every test; the Segmented Control is gone. `TestResultsFilterState` is replaced by `TestResultsCountState`, `onFilterChange` reports `"item-press"` rather than `"input-change"`, and `TestResultsApi` swaps `readFilter`, `syncFilter` and `filterState` for `pressCount`.
- **Breaking (Sources):** `SourceEntry.initial` and the icon part's `initial` state are gone. Without a favicon the icon shows a link glyph rather than the site's initial.
- Inline Citation's card adds an `icon` part (React `InlineCitationIcon`, web `kind-inline-citation-icon`) and lists the title before the host, as Sources does.
- Terminal no longer shows a cursor once the command finishes, reads "exit N" beside the duration rather than an "Exit N" pill, and shows the `$ command` line only when a `label` replaces the command as the title. Lines are measured at their own index, so a narrow screen no longer leaves a gap.
- Test Results shows one mark per row: a failed test's Stack Trace drops its own mark. Test names wrap to two lines.
- Document's header keeps its title on a narrow screen, showing Download as an icon; the icon tile is gone, Show more is a text button, and a table inside has row rules only. A Download button's label sits in a `data-document-download-label` span.
- Markdown Table's Copy floats over the header's end on hover or focus, so the last header lines up with its column. Code Block and Markdown Table fade the edge where lines are cut.
- Transcript marks the playing segment with its bar and words, not a tint, its search field has no box, and its text sits on a 20px line. Stack Trace's library frames toggle reads as words, not italic code, and locations end in an ellipsis rather than breaking.
