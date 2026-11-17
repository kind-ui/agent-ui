import { fuzzyScore, type MatchSegment, matchRanges, matchSegments } from "@ui-sdk/core/text-match";
import type { TranscriptSegment } from "../../types/index.js";

/** The text a segment shows, piece by piece: each of its words, or its whole `text` without words. */
export const segmentPieces = (segment: TranscriptSegment): string[] =>
  segment.words ? segment.words.map((word) => word.text.trim()) : [segment.text];

/**
 * The segments whose text or speaker matches `query`, by `fuzzyScore` above zero, in their own order. A blank query
 * keeps every segment and returns `segments` itself.
 */
export function searchSegments(segments: TranscriptSegment[], query: string): TranscriptSegment[] {
  if (!query.trim()) return segments;
  return segments.filter(
    (segment) =>
      fuzzyScore(segment.speaker, query) > 0 || fuzzyScore(segmentPieces(segment).join(" "), query) > 0,
  );
}

/**
 * Each piece split into what `query` matched and what it didn't, as Model Selector marks a model's name. The pieces
 * are matched as the text they show together, a space apart, so a match across two words marks its part of each.
 */
export function highlightPieces(pieces: string[], query: string): MatchSegment[][] {
  if (!query.trim()) return pieces.map((text) => [{ text, match: false }]);
  const ranges = matchRanges(pieces.join(" "), query, "fuzzy");
  let offset = 0;
  return pieces.map((text) => {
    const start = offset;
    offset += text.length + 1;
    const own = ranges
      .filter((range) => range.start < start + text.length && range.end > start)
      .map((range) => ({
        start: Math.max(range.start - start, 0),
        end: Math.min(range.end - start, text.length),
      }));
    return matchSegments(text, own);
  });
}

/** The last index whose `start` is at or before `time`, or -1. */
const lastStartedBy = (items: readonly { start: number }[], time: number) => {
  let low = 0;
  let high = items.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if ((items[middle]?.start ?? Number.POSITIVE_INFINITY) <= time) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
};

/**
 * The segment playing at `time`, by id, and the index of its word playing then. Segments are in time order, and so
 * are a segment's words. Before the first segment, in a gap between two, or between two words, there's none.
 */
export function currentAt(segments: TranscriptSegment[], time: number): { segment?: string; word?: number } {
  const segment = segments[lastStartedBy(segments, time)];
  if (!segment || time >= segment.end) return {};
  const words = segment.words ?? [];
  const index = lastStartedBy(words, time);
  const word = words[index];
  return word && time < word.end ? { segment: segment.id, word: index } : { segment: segment.id };
}
