import { countdownText } from "./countdown.js";
import { WORDS } from "./words.js";

/**
 * The retry line's sentence after its reason: "Retrying in 4 sec, attempt 2 of 5", or "Retrying, attempt 2 of 5"
 * once nothing counts down.
 */
export function retryText(
  retry: { attempt: number; maxAttempts?: number | undefined },
  seconds: number | null,
  locale?: string,
): string {
  const when = countdownText(seconds, locale);
  const of = retry.maxAttempts ? ` of ${retry.maxAttempts}` : "";
  return `${WORDS.retrying}${when ? ` in ${when}` : ""}, ${WORDS.attempt} ${retry.attempt}${of}`;
}

/** The reason that leads the line, as a sentence: "Rate limited.". Empty without one. */
export const retryReason = (reason: string | undefined): string =>
  !reason ? "" : /[.!?…]$/.test(reason) ? reason : `${reason}.`;

/** What a new attempt announces, once: "Retrying, attempt 2". Never the countdown. */
export const retryAnnouncement = (attempt: number): string =>
  `${WORDS.retrying}, ${WORDS.attempt} ${attempt}`;

/** "Failed after 5 attempts". */
export const failedAfterText = (attempts: number): string =>
  `${WORDS.failedAfter} ${attempts} ${attempts === 1 ? WORDS.attempt : `${WORDS.attempt}s`}`;
