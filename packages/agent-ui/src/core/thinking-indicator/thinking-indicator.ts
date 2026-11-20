import { definePrimitive } from "@ui-sdk/core";
import { type IndicatorPrimitive, indicator } from "../indicator.js";

export const thinkingIndicatorPrimitive: IndicatorPrimitive = definePrimitive({
  name: "kind-thinking-indicator",
  ...indicator("Thinking…"),
});
