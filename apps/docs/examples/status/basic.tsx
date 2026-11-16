"use client";
import { Status } from "@/components/ui/status";

export default function StatusExample() {
  return (
    <ul className="flex w-72 flex-col gap-2 text-sm">
      <li className="flex items-center justify-between gap-3">
        Build
        <Status status="complete" />
      </li>
      <li className="flex items-center justify-between gap-3">
        Deploy to staging
        <Status status="running" />
      </li>
      <li className="flex items-center justify-between gap-3">
        Approve release
        <Status status="awaiting-input" />
      </li>
    </ul>
  );
}
