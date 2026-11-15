import type { UploadItem } from "@kind-ui/agent-ui/core";

export const uploads: UploadItem[] = [
  { id: "report", name: "quarterly-report.pdf", size: 2_400_000, progress: 42, status: "uploading" },
  { id: "notes", name: "meeting-notes.md", size: 18_000, progress: 0, status: "queued" },
  { id: "photo", name: "team-offsite.jpg", size: 3_100_000, progress: 100, status: "done" },
  {
    id: "dataset",
    name: "training-set.csv",
    size: 48_000_000,
    progress: 63,
    status: "error",
    error: "Connection lost. Try again.",
  },
];

/** What the host was asked to do, and a `setStatus` the test drives. */
export function uploadHost(update: (change: (items: UploadItem[]) => UploadItem[]) => void) {
  const calls = {
    files: [] as string[],
    rejected: [] as string[],
    cancels: [] as string[],
    retries: [] as string[],
  };
  const setStatus = (id: string, status: UploadItem["status"], progress?: number) =>
    update((items) =>
      items.map((item) => (item.id === id ? { ...item, status, progress: progress ?? item.progress } : item)),
    );
  Object.assign(window, { kindUploader: { calls, setStatus } });
  return {
    onFiles: (files: File[]) => {
      calls.files.push(...files.map((file) => file.name));
      update((items) => [
        ...items,
        ...files.map((file) => ({
          id: file.name,
          name: file.name,
          size: file.size,
          progress: 0,
          status: "queued" as const,
        })),
      ]);
    },
    onReject: (rejected: { file: File }[]) => calls.rejected.push(...rejected.map(({ file }) => file.name)),
    onCancel: (id: string) => {
      calls.cancels.push(id);
      setStatus(id, "cancelled");
    },
    onRetry: (id: string) => {
      calls.retries.push(id);
      setStatus(id, "uploading", 0);
    },
  };
}
