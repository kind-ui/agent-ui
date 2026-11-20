import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkUiSdkUsage } from "../check-ui-sdk-usage.mjs";

const fx = (name) => join(dirname(fileURLToPath(import.meta.url)), "fixtures", "ui-sdk-usage", name);

test("conforming tree passes", () => assert.deepEqual(checkUiSdkUsage(fx("ok"), {}), []));

test("bypassing UI SDK fails", () => {
  const errors = checkUiSdkUsage(fx("bad"), { "src/core/x.ts": "Not in spec" }).join("\n");
  assert.match(errors, /src\/core\/widget\/widget.ts: component must be defined with definePrimitive/);
  assert.match(errors, /render file must use createParts/);
  assert.match(errors, /typed\.tsx: render file must use createParts/);
  assert.match(errors, /onKeyDown belongs in the primitive/);
  assert.match(errors, /not a spec exception/);
  assert.match(errors, /widget\/widget.ts: tabindex must come from UI SDK/);
  assert.match(errors, /widget\/scroller.ts: tabindex must come from UI SDK/);
  assert.match(errors, /widget\/field.ts: \.focus\( must come from UI SDK/);
  assert.match(errors, /styles\/widget.css: width on \[data-status-mark\] belongs in status-mark.css/);
  assert.match(errors, /styles\/widget.css: mask-size on \[data-status-mark\] belongs in status-mark.css/);
});

test("each new layer's hand-written behavior fails", () => {
  const errors = checkUiSdkUsage(fx("bad"), {}).join("\n");
  assert.match(errors, /src\/vue\/widget\.ts: onKeydown belongs in the primitive/);
  assert.match(errors, /src\/vue\/widget\.ts: imports \.\.\/\.\.\/core\/widget\/widget\.js/);
  assert.match(errors, /src\/svelte\/widget\/Part\.svelte: onkeydown= belongs in the primitive/);
  assert.match(errors, /src\/solid\/widget\.tsx: tabIndex belongs in the primitive/);
  assert.doesNotMatch(errors, /src\/(vue|svelte|solid)\/[\w/]*: render file must use createParts/);
});
