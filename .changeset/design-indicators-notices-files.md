---
"@kind-ui/agent-ui": minor
---

Indicators, notices and files say each fact once.

- Loader, Thinking Indicator and Typing Indicator draw the same dots, sized by the new `--kind-dot-size` token (5px; they were 6, 4 and 7px), always before the label. Thinking Indicator's dots now come before its label in the markup too.
- Breaking: Typing Indicator has no bubble: it no longer draws the user message's fill and radius around an assistant reply, so the dots sit where the reply's first line starts. Set your own background on `[data-slot="kind-typing-indicator"]` to keep one.
- Breaking: the default labels, and so the accessible names, are "Loading…" and "Thinking…" (were "Loading" and "Thinking").
- Status is its mark and its words, without the tinted pill and border.
- A status mark waiting on the person (`awaiting-input`) pulses three times, then holds still, rather than looping until answered.
- Notice: info and success notices are a plain bordered surface whose mark carries the color; warning and error take the `--kind-tint-fill` tint in place of a tinted border. Dismiss is the shared 28px icon button, with a 44px hit area under a coarse pointer.
- Attachments and Uploader: an error shows a red mark beside plain words, without a red border, tile or text. File glyphs sit bare, without a tile, and the dropzone's upload glyph without its circle.
- File sizes under 1 kB read "812 bytes", not "812 byte".
- Attachments and Uploader show a glyph for a file's kind (image, document, code, spreadsheet, archive, audio or video), from `mediaType` or the extension, through `data-file-kind`; `UploadItem` takes an optional `mediaType`. An attachment chip reads its extension beside its size ("PDF · 482 kB").
- Notices, attachment chips and upload rows sit on the raised surface with a hairline instead of a 1px border. A finished upload's bar fades out in place.
- Uploader keeps its action column on every row, so every bar ends at the same place; a finished row drops its bar and reads "3.1 MB · Uploaded"; a failed or cancelled bar stops in gray. Cancel and Retry are the shared icon button.
