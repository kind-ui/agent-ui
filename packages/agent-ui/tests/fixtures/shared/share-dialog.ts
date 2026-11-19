export const shareLink = "https://example.com/share/abc123";

export type ShareCall = { action: "create" | "revoke"; reason: string; source?: string };

/** What the fixture host records, and the deferred promise its last create or revoke returned. */
export function shareDialogHost() {
  let settle: { resolve(): void; reject(): void; action: ShareCall["action"] } | undefined;
  const host = {
    calls: [] as ShareCall[],
    copies: [] as { link: string; reason: string }[],
    visibilities: [] as { value: string; reason: string; source?: string }[],
    /** Answers the pending call, making or clearing the link first, as a host does. */
    resolve: () => {},
    reject: () => settle?.reject(),
  };
  const call = (action: ShareCall["action"], details: { reason: string; source?: string }) => {
    host.calls.push({ action, reason: details.reason, source: details.source });
    return new Promise<void>((resolve, reject) => {
      settle = { resolve, reject, action };
    });
  };
  const answer = (done: (action: ShareCall["action"]) => void) => {
    host.resolve = () => {
      if (!settle) return;
      done(settle.action);
      settle.resolve();
    };
  };
  return { host, call, answer };
}
