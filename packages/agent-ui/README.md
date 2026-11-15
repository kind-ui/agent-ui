# @kind-ui/agent-ui

Agent-operable AI components built on [UI SDK](https://ui-sdk.dev/docs). Not yet published.

| Entry | Contents |
| --- | --- |
| `@kind-ui/agent-ui` | Neutral types and type guards |
| `@kind-ui/agent-ui/core` | Public primitive definitions, the markdown engine, the motion helper |
| `@kind-ui/agent-ui/adapters/ai-sdk` | AI SDK `UIMessage` mapping (`ai` is an optional peer) |
| `@kind-ui/agent-ui/styles.css` | Tailwind v4 source registration and theme tokens |

Styled React and Web Components are distributed through the registry, not this package.

## AI SDK adapter

`@kind-ui/agent-ui/adapters/ai-sdk` maps AI SDK `UIMessage`s to the neutral types. It imports `ai` with `import type` only and never calls the SDK, so its emitted JavaScript has no `ai` import. A consumer without `ai` can still import `toApprovalResponse` and `fromChatStatus`. The adapter's declarations reference `ai` types, so such a consumer needs `skipLibCheck` (TypeScript's common default for app projects).

| Export | Maps |
| --- | --- |
| `fromUIMessages(messages, status?)` | `UIMessage[]` to `Message[]`. `status` applies to the last message, and earlier messages are `"complete"`. |
| `fromUIMessagePart(part, { messageId, index })` | One part. Returns `null` only for `step-start`. |
| `fromChatStatus(status)` | `submitted`, `streaming`, `ready` → `complete`, `error` |
| `toApprovalResponse(approval, decision)` | The argument for `addToolApprovalResponse`: `{ id: approval.approvalId, approved, reason? }` |

### Tested AI SDK version

Tested against `ai@7.0.173`. The spec §4.3 tool states were observed in `ai@7.0.136`. All seven states (`input-streaming` through `output-denied`) are unchanged in `7.0.173`. Differences and adapter decisions:

- **New part types:** `custom`, `reasoning-file`, and the experimental `steering-message` have no neutral counterpart. Like any unknown type, each maps to `{ type: "data", name: <part type>, data: <part> }`.
- **Unknown tool states** map to `data` too, so the adapter never guesses a step status.
- **`dynamic-tool` with `dynamic: false`** is a static tool the SDK normalized after its schema went missing. It maps with `dynamic: false`.
- **`approval.isAutomatic`** maps to `approval.state = "auto"`. Otherwise an approval with `approved` set is `"responded"`, and one without is `"requested"`.
- **Approvals on `output-available` and `output-error`** (the SDK keeps `approved: true` there) map as `"responded"` with their decision.
- **`preliminary: true`** on `output-available` maps to `output.state = "preliminary"`.
- **`output-error` input:** `input` is preserved. When it is absent, the deprecated `rawInput` is used.
- **Approval generation:** the SDK has none, so mapped approvals are `generation: 0`. Hosts that replace requests own the generation.
- **Not mapped:** opaque approval fields (`descriptor`, `signature`, `requestReason`, `inputSchemaInput`), tool `title` and `toolMetadata`, text `citations`, and `providerMetadata`. The neutral `Approval` has no field for opaque metadata. None of these fields grant authority.
