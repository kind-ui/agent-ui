import { Diff } from "../components/ui/solid/diff.js";

export default function DiffItem() {
  return (
    <Diff
      file={{ path: "src/greet.ts" }}
      before={'export const greeting = "Hello";\n'}
      after={'export const greeting = "Hi";\n'}
    />
  );
}
