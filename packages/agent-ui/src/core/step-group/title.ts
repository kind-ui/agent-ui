import type { StepGroupItem, StepStatus } from "../../types/index.js";
import { durationLabel } from "../time.js";
import { WORDS } from "../words.js";

/** How one kind of step reads: `{ live: "Reading", done: "Read", one: "file", many: "files" }`. */
export type StepGroupKind = { live: string; done: string; one: string; many: string };

export type StepGroupKinds = Record<string, StepGroupKind>;

const FINISHED: ReadonlySet<StepStatus> = new Set(["complete", "error", "cancelled"]);

/** Whether a step has finished: complete, failed or stopped. */
export const isFinished = (status: StepStatus): boolean => FINISHED.has(status);

const code = (text: string) => `\`${text}\``;
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const steps = (count: number) => plural(count, "step", "steps");
const kindOf = (item: StepGroupItem, kinds: StepGroupKinds) =>
  item.kind !== undefined && Object.hasOwn(kinds, item.kind) ? kinds[item.kind] : undefined;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** "a", "a and b", "a, b and c". */
const list = (pieces: readonly string[]) =>
  pieces.length < 2 ? (pieces[0] ?? "") : `${pieces.slice(0, -1).join(", ")} and ${pieces.at(-1)}`;

const targetsOf = (items: readonly StepGroupItem[]) => [
  ...new Set(items.flatMap((item) => (item.target ? [item.target] : []))),
];

/** How many things the steps acted on: each unique target once, and each step without one. */
const units = (items: readonly StepGroupItem[]) =>
  targetsOf(items).length + items.filter((item) => !item.target).length;

/** A kind's objects: up to two targets by name, else (or when `count`) how many ("6 files"). */
const objects = (items: readonly StepGroupItem[], kind: StepGroupKind, count: boolean): string[] => {
  const targets = targetsOf(items);
  return !count && items.every((item) => item.target) && targets.length <= 2
    ? targets.map(code)
    : [plural(units(items), kind.one, kind.many)];
};

/**
 * What the steps did, kinds joined in first-use order, up to `maxClauses`, then "N other steps": "Read `auth.ts`,
 * `db.ts` and ran `npm test`". A kind names up to two targets, unless the sentence ends in other steps, where every
 * kind is counted ("Read 6 files, edited 2 files and 3 other steps"). Steps of a kind `kinds` doesn't word count
 * among the others, so without `kinds` it's "12 steps". Targets are in backticks (`codeSpans`).
 */
export function stepGroupSentence(
  items: readonly StepGroupItem[],
  kinds: StepGroupKinds = {},
  maxClauses = 2,
): string {
  const byKind = new Map<StepGroupKind, StepGroupItem[]>();
  for (const item of items) {
    const kind = kindOf(item, kinds);
    if (kind) byKind.set(kind, [...(byKind.get(kind) ?? []), item]);
  }
  const shown = [...byKind].slice(0, Math.max(1, maxClauses));
  if (shown.length === 0) return steps(items.length);
  const others = items.length - shown.reduce((count, [, of]) => count + of.length, 0);
  const pieces = shown.flatMap(([kind, of], index) => {
    const [first = "", ...rest] = objects(of, kind, others > 0);
    return [`${index === 0 ? kind.done : lower(kind.done)} ${first}`, ...rest];
  });
  if (others > 0) pieces.push(plural(others, WORDS.otherStep, WORDS.otherSteps));
  return capitalize(list(pieces));
}

/**
 * The live step, while steps run: `current`, else the one running step's kind and target ("Running `npm test`"),
 * else its kind counted ("Running 3 agents"). `undefined` without a running step of a known kind.
 */
export function stepGroupLive(
  items: readonly StepGroupItem[],
  kinds: StepGroupKinds = {},
  current?: string,
): string | undefined {
  if (current) return current;
  const running = items.filter((item) => item.status === "running");
  const [first] = running;
  const kind = first && kindOf(first, kinds);
  if (!first || !kind) return undefined;
  if (running.length === 1 && first.target) return `${kind.live} ${code(first.target)}`;
  return `${kind.live} ${plural(units(items.filter((item) => item.kind === first.kind)), kind.one, kind.many)}`;
}

export type StepGroupTitleInput = {
  status: StepStatus;
  items: readonly StepGroupItem[];
  kinds?: StepGroupKinds | undefined;
  maxClauses?: number | undefined;
  current?: string | undefined;
};

/**
 * The group's title (Wave 7 spec §5): the live step while any runs, the work so far while one waits, the work done
 * (complete and failed steps; stopped ones never did theirs) once finished, "N steps" before anything ran.
 */
export function stepGroupTitle({ status, items, kinds, maxClauses, current }: StepGroupTitleInput): string {
  const done = items.filter((item) => item.status === "complete" || item.status === "error");
  const running = items.some((item) => item.status === "running") || status === "running";
  const live =
    running && (status !== "awaiting-input" || done.length === 0) && stepGroupLive(items, kinds, current);
  if (live) return live;
  return done.length === 0 ? steps(items.length) : stepGroupSentence(done, kinds, maxClauses);
}

export type StepGroupMetaInput = {
  status: StepStatus;
  items: readonly StepGroupItem[];
  open: boolean;
  durationSeconds?: number | undefined;
};

/**
 * The group's meta: "3 of 5" while running, "1 waiting" open or "Waiting for approval" folded while a step waits,
 * "1 failed · 41 sec", "Failed after 12 sec", "Stopped after 41 sec", else the duration.
 */
export function stepGroupMeta({ status, items, open, durationSeconds }: StepGroupMetaInput): string {
  const count = (test: (status: StepStatus) => boolean) => items.filter((item) => test(item.status)).length;
  const failed = count((each) => each === "error");
  const duration = durationLabel(durationSeconds);
  const failures = failed > 0 ? `${failed} failed` : "";
  const join = (...pieces: string[]) => pieces.filter(Boolean).join(" · ");
  if (status === "awaiting-input") {
    const waiting = count((each) => each === "awaiting-input");
    return open && waiting > 0 ? `${waiting} ${WORDS.waitingCount}` : WORDS.waiting;
  }
  if (status === "running" || items.some((item) => item.status === "running")) {
    return join(failures, items.length ? `${count(isFinished)} of ${items.length}` : "");
  }
  if (status === "error")
    return failures ? join(failures, duration) : join(duration && `${WORDS.failedAfter} ${duration}`);
  if (status === "cancelled") return duration ? `${WORDS.stoppedAfter} ${duration}` : "";
  return status === "complete" ? duration : "";
}

/** "3 agents finished, 1 failed": steps that finished together, read as one sentence. */
export function stepGroupFinished(items: readonly StepGroupItem[], kinds: StepGroupKinds = {}): string {
  const kind = kindOf(items[0] ?? { id: "", status: "complete" }, kinds);
  const same = kind !== undefined && items.every((item) => kindOf(item, kinds) === kind);
  const noun = same ? plural(items.length, kind.one, kind.many) : steps(items.length);
  const failed = items.filter((item) => item.status === "error").length;
  const stopped = items.filter((item) => item.status === "cancelled").length;
  return [`${noun} ${WORDS.finished}`, failed ? `${failed} failed` : "", stopped ? `${stopped} stopped` : ""]
    .filter(Boolean)
    .join(", ");
}
