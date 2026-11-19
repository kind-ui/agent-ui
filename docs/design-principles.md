# Design principles

agent-ui ships parts of someone else's product. A person meets them mid-task, beside the host's own UI, while an agent streams into them. So the bar is fit and calm, not presence. These principles decide what we build and how it looks; the `impeccable`, `apple-design` and `web-interface-guidelines` skills are how we check it (see "Component task routine" in `AGENTS.md`).

## Restraint

- **Every element earns its place.** A border, badge, icon, label, divider or shadow is there because a person needs it to read or act. If removing it loses nothing, remove it. Prefer one quiet affordance over two loud ones.
- **Operate, not persuade.** Our components are tools. Hierarchy comes from type, spacing and one accent, not gradients, glows, glass or decoration. Brand lives in precise details: alignment, rhythm, consistent radii.
- **No AI tropes.** No sparkle icons, anywhere. No shimmering "magic" text, rainbow borders or pulsing gradients to say an agent is at work; a status mark and plain words do.
- **Words over ornament.** Statuses have text ("Running", "Denied", "2 of 5"), not color alone. Copy is short, specific and in sentence case.

## Motion with purpose

- Motion explains a change: something arrived, left, opened or moved. It never decorates. If a person wouldn't miss it, cut it.
- Respond at once, track input one to one, and let every transition be interrupted from where it is (`apple-design` §1–3). Entrances play once, on mount; updates never replay them.
- Durations and easings come only from the motion tokens. Every animation has a reduced form (opacity, 120 ms at most) and a `motion="none"` form (the final state at once).
- Loops (spinners, dot flow) are for waiting only, and stop the moment the wait ends.

## Stability

- **No layout shift.** Streaming text, status changes, late metadata, a button that comes or goes: nothing above or beside them moves. Reserve the space, swap in place, or grow below.
- Results collapse to a compact summary when they complete; resolved decisions keep their outcome, not their buttons.
- Follow the live edge while the reader is there, and let go the moment they scroll away.

## Light and dark, one token system

- Every color, radius and duration is a `--kind-*` token, so a host restyles us by changing tokens, not by fighting selectors. Both themes are designed, not inverted: check each component in light and dark.
- Contrast holds at 4.5:1 for text and 3:1 for marks and focus rings, in both themes and in forced colors.

## Agent-first

- Everything a person can do, an agent can do through the same component, and the snapshot names it the way a person would. A design that only works by pointer isn't done.
- Keyboard, focus, ARIA and announcements come from UI SDK. Design within them; don't paint over them.

## When not to add

Don't add a component when:

- a host can compose it from ones we ship in a few lines, or it's a layout the host's own app already owns (pages, shells, navigation chrome);
- it serves one demo or one model provider rather than a recurring agent pattern;
- it duplicates a component with a different look; extend the existing one with an option or a token instead;
- we can't yet name its streaming, approval and agent behavior. A component is its behavior; the look comes last.

Don't add an effect when:

- it signals "AI" rather than a state change;
- it animates something that didn't change, or loops while nothing is waiting;
- it needs a new token or a stronger selector to exist, or it reads in only one theme;
- it moves content the reader is looking at.

When in doubt, ship the quieter version. Adding later is cheap; taking back a look people depend on isn't.
