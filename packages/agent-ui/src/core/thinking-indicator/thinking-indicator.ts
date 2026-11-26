import { definePrimitive } from "../define-primitive.js";
import { type IndicatorPrimitive, indicator } from "../indicator.js";

export const thinkingIndicatorPrimitive: IndicatorPrimitive = definePrimitive({
  name: "kind-thinking-indicator",
  ...indicator("Thinking…"),
});
