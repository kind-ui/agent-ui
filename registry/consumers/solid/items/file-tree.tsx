import { FileTree } from "../components/ui/solid/file-tree.js";

export default function FileTreeItem() {
  return <FileTree entries={[{ path: "src/index.ts", change: "modified", additions: 2 }]} />;
}
