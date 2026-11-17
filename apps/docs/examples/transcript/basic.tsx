"use client";

import type { TranscriptSegment } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Transcript } from "@/components/ui/transcript";

// Each word gets a moment of its own, the way a speech-to-text service times them.
const timed = (id: string, speaker: string, start: number, text: string): TranscriptSegment => {
  let at = start;
  const words = text.split(" ").map((word) => {
    const timing = { text: word, start: at, end: at + 0.3 };
    at += 0.4;
    return timing;
  });
  return { id, speaker, start, end: at, text, words };
};

const segments = [
  timed("1", "Priya", 0, "Morning, everyone. Let's start with the release checklist for Thursday."),
  timed("2", "Marco", 5, "The migration ran cleanly on staging last night, so that box is ticked."),
  timed("3", "Priya", 11, "Great. Is the billing page still waiting on review?"),
  timed(
    "4",
    "Lena",
    15,
    "It is. I pushed the copy changes an hour ago, and the screenshots are in the thread.",
  ),
  timed("5", "Marco", 22, "I can take that review after lunch."),
];
const length = 25;

export default function TranscriptExample() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setTime((now) => (now + 0.1) % length), 100);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <button type="button" className="self-start text-sm underline" onClick={() => setPlaying(!playing)}>
        {playing ? "Pause" : "Play"}
      </button>
      <Transcript segments={segments} currentTime={time} onSeek={(start) => setTime(start)} />
    </div>
  );
}
