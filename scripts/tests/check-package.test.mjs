import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findForbiddenImports } from "../check-package.mjs";

const dir = mkdtempSync(join(tmpdir(), "check-package-"));
let serial = 0;
const fixtureWith = (source) => {
  const file = join(dir, `${serial++}.js`);
  writeFileSync(file, source);
  return file;
};

test("a React import is forbidden", () =>
  assert.deepEqual(findForbiddenImports([fixtureWith('import "react"')]), ["react"]));

test("subpaths, reexports and dynamic imports of react-dom and ai are forbidden", () =>
  assert.deepEqual(
    findForbiddenImports([
      fixtureWith('import { jsx } from "react/jsx-runtime";\nexport { x } from "react-dom/client";'),
      fixtureWith('const ai = await import("ai");'),
    ]),
    ["react", "react-dom", "ai"],
  ));

test("other packages and look-alike names pass", () =>
  assert.deepEqual(
    findForbiddenImports([
      fixtureWith(
        'import { definePrimitive } from "@ui-sdk/core";\nimport "./ai.js";\nimport "react-markdown";',
      ),
    ]),
    [],
  ));
