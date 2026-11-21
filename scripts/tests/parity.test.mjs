// Every component and internal wrapper a layer's manifest lists exports the same parts as React's (plan D6): the
// same PascalCase value exports. Lowercase helpers and types are each layer's own.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { manifests } from "../../registry/layers/index.mjs";

const src = new URL("../../packages/agent-ui/src/", import.meta.url).pathname;

const files = {
  react: (name) => `react/${name}.tsx`,
  vue: (name) => `vue/${name}.ts`,
  svelte: (name) => `svelte/${name}/index.ts`,
  solid: (name) => `solid/${name}.tsx`,
};

function partsOf(path) {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
  const names = new Set();
  const exported = (node) =>
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
  const bound = (name) => {
    if (ts.isIdentifier(name)) names.add(name.text);
    else for (const element of name.elements) if (!ts.isOmittedExpression(element)) bound(element.name);
  };
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement) && exported(statement))
      for (const declaration of statement.declarationList.declarations) bound(declaration.name);
    else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && exported(statement))
      statement.name && names.add(statement.name.text);
    else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.exportClause)
      for (const element of statement.exportClause.elements ?? [])
        if (!element.isTypeOnly) names.add(element.name.text);
  }
  return [...names].filter((name) => /^[A-Z]/.test(name)).sort();
}

/** Each listed component or internal whose parts differ from React's, with what's missing and extra. */
function differences(root, layers) {
  const found = [];
  for (const [layer, { components, internals }] of Object.entries(layers)) {
    const names = [...components, ...internals.map((name) => `internal/${name}`)];
    for (const name of names) {
      const path = join(root, files[layer](name));
      if (!existsSync(path)) {
        found.push(`${layer} ${name}: no ${files[layer](name)}`);
        continue;
      }
      const react = partsOf(join(root, files.react(name)));
      const ours = partsOf(path);
      const missing = react.filter((part) => !ours.includes(part));
      const extra = ours.filter((part) => !react.includes(part));
      if (missing.length || extra.length)
        found.push(
          `${layer} ${name}: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}`,
        );
    }
  }
  return found;
}

test("every ported component and internal has React's parts", () => {
  assert.deepEqual(differences(src, manifests), []);
});

test("a ported component that misses a part fails", () => {
  const root = mkdtempSync(join(tmpdir(), "kind-parity-"));
  try {
    mkdirSync(join(root, "react"));
    mkdirSync(join(root, "vue"));
    writeFileSync(join(root, "react/step.tsx"), readFileSync(join(src, "react/step.tsx")));
    writeFileSync(
      join(root, "vue/step.ts"),
      "const step = {} as never;\nexport const { Step, StepTrigger, StepIcon, StepTitle, StepContent, StepChildren } = step;\nexport { StepList, StepListItem } from './list.js';\nexport const stepHelper = 1;\n",
    );
    assert.deepEqual(differences(root, { vue: { components: ["step"], internals: [] } }), [
      "vue step: missing StepMeta; extra none",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
