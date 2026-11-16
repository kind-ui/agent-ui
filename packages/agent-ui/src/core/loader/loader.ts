import { definePrimitive } from "@ui-sdk/core";
import { type IndicatorPrimitive, indicator } from "../indicator.js";

export const loaderPrimitive: IndicatorPrimitive = definePrimitive({
  name: "kind-loader",
  ...indicator("Loading"),
});
