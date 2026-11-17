---
"@kind-ui/agent-ui": minor
---

Wave 4: Sources, Inline Citation, Document, Generated Image, File Tree, Terminal, Stack Trace, Test Results, Transcript, Selection and Action, in React and Web Components, with their `@kind-ui` registry items.

- New dependencies: `ansi-sequence-parser` (Terminal's colors) and `stacktrace-parser` (Stack Trace's frames).
- `./core` exports the new primitives and their helpers (`createAnsiLines`, `parseStack`, `isLibraryFrame`, `pathItems`, `treeValues`, `documentSize`, `testCounts`, `testItems`, `testValue`, `emptyTestsText`, `currentAt` and `searchSegments`), and the package root adds the `FileTreeEntry`, `StackFrame`, `TranscriptSegment`, `TranscriptWord` and `SelectionActionItem` types. `Source` gains an optional `favicon`.
- Model Selector takes an `icon` per model, shown before its name in the list and in the field: an image URL, or on React an element and on Web Components an element it clones. `ModelOption` takes the icon's type as a parameter (`ModelOption<Icon = string>`), and the list now opens against the whole field.
- **Breaking:** Model Selector's `contentState` takes the content's instance id, and the render files use a new Combobox item icon. Update copied files along with the package with `npx shadcn@latest add @kind-ui/model-selector --overwrite` (or `@kind-ui/model-selector-web`): until then the React file doesn't compile and the web element throws when it renders.
- **Breaking (types):** `ModelSelectorOptions`, `ModelSelectorState`, `getModels()` and `ModelSelectorItem` in `./core` use `ModelOption<unknown>`, since core passes icons through untouched, so code that typed them as `ModelOption[]` takes `ModelOption<unknown>[]`. `ModelSelectorContentState` gains `anchor`.
- Status marks keep their glyph centered at any size and device pixel ratio. Resize a mark with the new `--kind-status-mark-size` (default `16px`, even pixels), set on the mark or any ancestor, rather than `width` and `height`.
- New `--kind-ansi-*` tokens for the 16 named terminal colors.
- Queue asks `onRemove` once per item: a host that keeps an item after a failed removal passes a new object for it to allow another try.
- A Task, Plan or Queue item that's removed and added again plays its entrance again.
- Step-based components and Guardrail Notice return focus to their own trigger when their content closes with focus inside.
- Icon buttons and file icons show in forced colors, in Message, Tool, Queue, Checkpoint, Code Block, Markdown Table, Conversation, Composer, Attachments, Uploader and Context Meter.
