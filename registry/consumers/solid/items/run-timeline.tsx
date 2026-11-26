import { RunTimeline } from "../components/ui/solid/run-timeline.js";

export default function RunTimelineItem() {
  return (
    <RunTimeline
      events={[{ id: "started", at: "2026-11-10T14:02:00Z", title: "Run started", status: "complete" }]}
    />
  );
}
