import { StackTrace } from "../components/ui/solid/stack-trace.js";

export default function StackTraceItem() {
  return (
    <StackTrace
      stack={"TypeError: x is undefined\n    at main (/app/src/index.ts:7:1)"}
      onOpenFrame={() => {}}
    />
  );
}
