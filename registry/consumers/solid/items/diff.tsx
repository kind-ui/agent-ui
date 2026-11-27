import { Diff } from "../components/ui/solid/diff.js";

export default function DiffItem() {
  return <Diff files={[{ path: "src/app.ts", before: "const a = 1;\n", after: "const a = 2;\n" }]} />;
}
