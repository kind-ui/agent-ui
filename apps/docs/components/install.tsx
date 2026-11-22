import { installCommands } from "@/lib/frameworks";
import { Code, FrameworkTabs } from "./example-code";

/** Installation tabs for every layer that ships the component: `<Install name="step" />`. */
export function Install({ name }: { name: string }) {
  return (
    <FrameworkTabs
      tabs={installCommands(name).map(({ label, code }) => ({
        label,
        children: <Code code={code} lang="bash" />,
      }))}
    />
  );
}
