import type { TranscriptSegment } from "@kind-ui/agent-ui";

const timed = (start: number, text: string) => {
  let at = start;
  return text.split(" ").map((word) => {
    const length = 0.25 + word.length * 0.05;
    const timing = { text: word, start: at, end: at + length };
    at += length + 0.1;
    return timing;
  });
};

const segment = (
  id: string,
  speaker: string,
  start: number,
  end: number,
  text: string,
): TranscriptSegment => ({
  id,
  speaker,
  start,
  end,
  text,
  words: timed(start, text),
});

export const standup: TranscriptSegment[] = [
  segment("s1", "Priya", 0, 6, "Morning, everyone. Let's start with the release checklist for Thursday."),
  segment("s2", "Marco", 6.5, 13, "The migration ran cleanly on staging last night, so that box is ticked."),
  segment("s3", "Priya", 13.5, 18, "Great. Is the billing page still waiting on review?"),
  segment(
    "s4",
    "Lena",
    18.5,
    27,
    "It is. I pushed the copy changes an hour ago, and the screenshots are in the thread.",
  ),
  { id: "s5", speaker: "Marco", start: 28, end: 33, text: "I can take that review after lunch." },
  segment(
    "s6",
    "Priya",
    33.5,
    40,
    "Perfect. Last thing: the on-call rotation starts Monday, so check your calendars.",
  ),
  segment("s7", "Lena", 61, 65, "One more question about the billing release."),
];

/** `count` segments of a long call, alternating speakers, ten seconds apart, each with timed words. */
export const manySegments = (count: number): TranscriptSegment[] =>
  Array.from({ length: count }, (_, index) =>
    segment(
      `m${index}`,
      index % 2 ? "Marco" : "Priya",
      index * 10,
      index * 10 + 9,
      `Point ${index + 1} on the agenda covers the rollout plan and who owns the follow up.`,
    ),
  );
