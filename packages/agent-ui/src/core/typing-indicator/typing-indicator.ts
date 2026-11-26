import { definePrimitive } from "../define-primitive.js";
import { type IndicatorPrimitive, indicator } from "../indicator.js";

export const typingIndicatorPrimitive: IndicatorPrimitive = definePrimitive({
  name: "kind-typing-indicator",
  ...indicator("Typing"),
});
