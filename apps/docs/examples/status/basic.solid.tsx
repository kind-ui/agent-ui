import { Status } from "@/components/ui/solid/status";

export default function StatusExample() {
  return (
    <ul class="flex w-72 flex-col gap-2 text-sm">
      <li class="flex items-center justify-between gap-3">
        Build
        <Status status="complete" />
      </li>
      <li class="flex items-center justify-between gap-3">
        Deploy to staging
        <Status status="running" />
      </li>
      <li class="flex items-center justify-between gap-3">
        Approve release
        <Status status="awaiting-input" />
      </li>
    </ul>
  );
}
