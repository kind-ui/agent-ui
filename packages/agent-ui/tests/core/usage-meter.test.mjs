import assert from "node:assert/strict";
import { test } from "node:test";
import { usageCountText, usageValueText } from "@kind-ui/agent-ui/core";

test("usageValueText names the meter, the amounts and the share", () => {
  assert.equal(usageValueText("Usage", 3.2, 5, "currency", "USD", "en-US"), "Usage, $3.20 of $5.00, 64%");
  assert.equal(
    usageValueText("Requests", 600, 500, "requests", "USD", "en-US"),
    "Requests, 600 of 500 requests, 100%",
  );
});

test("usageCountText writes the unit once", () => {
  assert.equal(usageCountText(57600, 128000, "tokens", "USD", "en-US"), "57,600 of 128,000 tokens");
  assert.equal(usageCountText(1.5, 10, "currency", "EUR", "de-DE"), "1,50\u00a0€ of 10,00\u00a0€");
});
