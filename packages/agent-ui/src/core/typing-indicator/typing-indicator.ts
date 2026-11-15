import { definePrimitive } from "@ui-sdk/core";
import { type IndicatorPrimitive, indicator } from "../indicator.js";

export const typingIndicatorPrimitive: IndicatorPrimitive = definePrimitive({
  name: "kind-typing-indicator",
  ...indicator("Typing"),
});
