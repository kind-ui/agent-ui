const slot = <T>(definition: T) => definition;
export const viewport = slot({ focus: "tab-stop" });
export const article = slot({ attrs: () => ({ tabindex: "0" }) });
