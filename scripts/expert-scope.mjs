// Prints which layer experts a change needs and the files each should read, for the
// expert-review skill. Adapted from Apache-2.0 work; see THIRD_PARTY_NOTICES.md.
//
//   node scripts/expert-scope.mjs                    Each expert from its own "Last reviewed" commit.
//   node scripts/expert-scope.mjs --base main        Everyone from one base, like a branch before pushing.
//   node scripts/expert-scope.mjs --json core web    The plan as JSON, only for the named experts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const pkg = "packages/agent-ui/";

const owners = {
  core: [
    /^packages\/agent-ui\/src\/core\/(?!motion\/|markdown\/)/,
    /^packages\/agent-ui\/src\/(types|adapters|internal)\//,
    /^packages\/agent-ui\/src\/index\.ts$/,
    /^packages\/agent-ui\/tests\/core\/(?!motion|markdown)/,
    /^tests\/types\//,
    /^scripts\//,
  ],
  react: [/^packages\/agent-ui\/src\/react\//, /^packages\/agent-ui\/tests\/fixtures\/react\//],
  web: [/^packages\/agent-ui\/src\/web\//, /^packages\/agent-ui\/tests\/fixtures\/web\//],
  styles: [
    /^packages\/agent-ui\/src\/styles\//,
    /^packages\/agent-ui\/src\/core\/motion\//,
    /^packages\/agent-ui\/tests\/core\/motion/,
    /^tests\/browser\/.*motion/,
  ],
  markdown: [/^packages\/agent-ui\/src\/core\/markdown\//, /^packages\/agent-ui\/tests\/core\/markdown/],
};

// Both render layers render core primitives, and the browser specs run against both.
const shared = {
  react: (file) => file.startsWith(`${pkg}src/core/`) || file.startsWith("tests/browser/"),
  web: (file) => file.startsWith(`${pkg}src/core/`) || file.startsWith("tests/browser/"),
};

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: "string" },
    json: { type: "boolean", default: false },
  },
});

for (const name of positionals) {
  if (!(name in owners)) {
    console.error(`Unknown expert "${name}". Experts: ${Object.keys(owners).join(", ")}.`);
    process.exit(2);
  }
}
const experts = positionals.length ? positionals : Object.keys(owners);

function lastReviewed(expert) {
  const file = path.join(root, ".agents/experts", expert, "decisions.md");
  if (!existsSync(file)) return undefined;
  return readFileSync(file, "utf8").match(/^Last reviewed: `([0-9a-f]{7,40})`/m)?.[1];
}

function changed(base) {
  try {
    const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out.split("\n").filter(Boolean);
  } catch {
    console.error(`Can't diff ${base}...HEAD. Fetch the history it needs, or pass another --base.`);
    process.exit(1);
  }
}

const plan = [];
for (const expert of experts) {
  const base = flags.base ?? lastReviewed(expert);
  if (!base) {
    plan.push({ expert, base: null, own: [], shared: [], note: "no Last reviewed commit; pass --base" });
    continue;
  }
  const files = changed(base);
  const own = files.filter((file) => owners[expert].some((pattern) => pattern.test(file)));
  const reach = files.filter((file) => !own.includes(file) && shared[expert]?.(file));
  if (own.length || reach.length) plan.push({ expert, base, own, shared: reach });
}

if (flags.json) {
  console.log(JSON.stringify(plan, null, 2));
} else if (!plan.length) {
  console.log("No expert needed: nothing a layer expert owns changed.");
} else {
  const list = (files, max) => `${files.slice(0, max).join(", ")}${files.length > max ? ", ..." : ""}`;
  for (const entry of plan) {
    if (entry.note) {
      console.log(`${entry.expert}: ${entry.note}`);
      continue;
    }
    console.log(`${entry.expert}-expert, ${entry.base.slice(0, 8)}...HEAD`);
    console.log(`  own (${entry.own.length}): ${list(entry.own, 8)}`);
    console.log(`  shared (${entry.shared.length}): ${list(entry.shared, 5)}`);
  }
}
