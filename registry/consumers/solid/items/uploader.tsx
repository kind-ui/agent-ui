import { Uploader } from "../components/ui/solid/uploader.js";

export default function UploaderItem() {
  return (
    <Uploader
      aria-label="Uploads"
      items={[{ id: "report", name: "report.pdf", size: 2_400_000, progress: 42, status: "uploading" }]}
    />
  );
}
