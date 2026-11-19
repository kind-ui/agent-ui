const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

/**
 * Calls `listener` once a minute, on one page-wide timer, so a page left open past midnight can read `todayKey` again
 * and move "Today" to "Yesterday". Returns the unsubscribe; the timer stops with the last listener.
 */
export const everyMinute = (listener: () => void): (() => void) => {
  listeners.add(listener);
  timer ??= setInterval(() => {
    for (const each of listeners) each();
  }, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    clearInterval(timer);
    timer = undefined;
  };
};
