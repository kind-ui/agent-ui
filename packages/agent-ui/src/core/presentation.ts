/**
 * The options with `presentation` `"auto"` when they name none, since `createPopup` presents as a popover unless the
 * options say otherwise. A prototype rather than a spread, because on Web Components `@ui-sdk/web` fills in the
 * callbacks on read.
 */
export const withAutoPresentation = <Options extends { presentation?: string | undefined }>(
  options: Options,
): Options => (options.presentation ? options : Object.create(options, { presentation: { value: "auto" } }));
