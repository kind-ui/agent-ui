import { getCurrentInstance } from "vue";

/**
 * React's `flushSync` for a case's own state: a change made through the returned function renders before it
 * returns, so a spec that writes and reads in one `page.evaluate` sees the DOM. Vue patches child components
 * synchronously within a parent's render, and the queued update finds nothing dirty afterwards.
 */
export function useFlush() {
  const instance = getCurrentInstance();
  if (!instance) throw new Error("useFlush must be called in setup.");
  return (change: () => void) => {
    change();
    instance.update();
  };
}
