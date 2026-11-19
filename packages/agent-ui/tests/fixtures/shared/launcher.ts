export const messages = [
  { id: "q", role: "user", text: "Where do I change my plan?" },
  { id: "a", role: "assistant", text: "Open Settings, then Billing, and pick a plan there." },
] as const;

export function launcherHost() {
  const changes: { open: boolean; reason: string; source: string }[] = [];
  const host = { changes, pageClicks: 0 };
  const record = (open: boolean, details: { reason: string; source: string }) =>
    changes.push({ open, reason: details.reason, source: details.source });
  const click = () => {
    host.pageClicks += 1;
  };
  Object.assign(window, { kindHost: host });
  return { record, click };
}
