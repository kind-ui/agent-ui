# Approvals

When the agent wants to do something a person should decide, the person decides. Agent UI shows the request, records the outcome in its place, and makes an agent's attempt to decide wait for a person too. Your job is to wire the decision through, never to make it.

## Never decide for the person

- Don't call `onApprove`, `addToolApprovalResponse({ approved: true })`, a Plan's accept, or a Checkpoint's restore from code that runs without a person's press.
- Don't make a tool skip approval on the client. Whether a tool needs approval is the server's `needsApproval`; don't remove it to make a demo run.
- Don't pick a risky Approval Mode by default, and don't change the mode for the person.
- Don't return `true` for `confirm` questions in `createAgent`'s `allow`, and don't set `agentConfirm={false}` unless your app asks the person another way.
- An approval the AI SDK made automatically maps to `approval.state: "auto"`, and the Tool shows no buttons for it. That's the server's decision, not yours to fake.

## Tool approval

A Tool whose `call.approval.state` is `"requested"` shows **Approve** and **Deny** as soon as you pass `onApprove` and `onDeny` (see [compose.md](compose.md#tool-calls-and-approvals) and [ai-sdk.md](ai-sdk.md)):

- `approvalReason` opens a reason box on the first Deny; `onDeny` gets `{ reason }`.
- A callback may return a promise. The buttons lock while it's pending, and after it resolves they stay locked until the host reports the request (`state: "responded"`, a new `approvalId` or a new `generation`). A rejection unlocks them and shows "Decision not sent. Try again."
- Once the approval is `"responded"`, the buttons give way to the outcome ("Approved", "Denied"), at the same height, so the conversation keeps what was decided.

## Confirmation

For an action that isn't a tool call (sending an email, deleting a file), render a Confirmation with an `Approval`:

```tsx
const [approval, setApproval] = useState<Approval>({ approvalId: "delete", generation: 1, state: "requested" });
const record = (approved: boolean, reason?: string) =>
  setApproval({ ...approval, state: "responded", decision: { approved, ...(reason && { reason }) } });

<Confirmation
  label="Delete notes.md?"
  approval={approval}
  reason
  onApprove={() => record(true)}
  onDeny={({ reason }) => record(false, reason)}
/>;
```

Run the action only after `onApprove`, on your server if it matters. A new request for the same thing gets a new `generation`.

## Other decisions

| Component | The person decides | Pass |
| --- | --- | --- |
| Plan | to start a proposed plan | `onAccept`, then `accepted` once recorded |
| Question | answers the agent needs before it goes on | `questions`, `onSubmit`, `onSkip`, then `submitted` |
| Checkpoint | to restore the chat to an earlier point | `onRestore`, then `restored` |
| Subagent | to stop a subagent | `onCancel` |
| Approval Mode | how much the agent may do without asking | `modes` (mark the risky one `danger: true`), `value`, `onValueChange` |

Approval Mode only records the person's choice. Enforce it where the tools run: with "Ask every time", every tool call needs approval; with a `danger` mode, say in its `description` what it allows.

## For agents

A Confirmation, a Tool's approval and the components in the table render `data-agent-confirm`, so an agent's `approve`, `deny`, `accept`, `restore`, `cancel` or `setValue` waits for the person through `createAgent`'s `allow`. See [agents.md](agents.md#ask-the-person-first).
