import { AddMenu } from "../components/ui/solid/add-menu.js";

export default function AddMenuItem() {
  return <AddMenu items={[{ id: "file", label: "Upload a file" }]} onAction={() => {}} />;
}
