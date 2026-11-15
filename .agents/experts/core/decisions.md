# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **No-`ai` consumers need `skipLibCheck`.** With `skipLibCheck: false`, `tests/types/no-ai` fails on `ai` types in `dist/adapters/ai-sdk/*.d.ts` (spec §3 says the other exports typecheck). Needs a spec decision: split `toApprovalResponse` into an `ai`-free entry, or document `skipLibCheck`.
- **Guard comment stripping is regex-based:** a `//` inside a string hides the rest of the line from the forbidden-pattern checks. Use the TypeScript scanner.
- **Guard rule 1 misses `definePrimitive<…Record<…>>(`** with nested generics.
- **Find-in-page sets `userToggled`**, so a step revealed by search no longer auto-closes on `complete`. Spec §5 needs to say whether search counts as a person.
- **Composer `disabled` is not exposed** on the submit part (`aria-disabled`), so assistive tech and the agent snapshot see an enabled button.
- **`src/internal/index.ts` is imported by nothing.**

## Revisit

Nothing yet.
