import type { TestInfo } from "@playwright/test";

/** The render layer a project runs, from its name: `wave-2-web`, `wave-1-web-firefox`, `wave-1-react-strict`, … */
export const layerOf = (testInfo: TestInfo): "react" | "web" =>
  /-web(-|$)/.test(testInfo.project.name) ? "web" : "react";
