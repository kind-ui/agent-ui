import { createSignal } from "solid-js";
import { Picker, type PickerChoice } from "@/components/ui/solid/picker";

// An image URL rather than an element: a Solid element is one DOM node, and the chosen branch's icon shows in the trigger and its row at once.
const gitBranchIcon = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
)}`;

const initialBranches: PickerChoice[] = [
  { value: "main", label: "main", icon: gitBranchIcon },
  {
    value: "picker",
    label: "picker",
    description: "Add the Picker component",
    meta: "↑3 ↓1",
    icon: gitBranchIcon,
  },
  { value: "menus", label: "menus", meta: "↑1 ↓4", icon: gitBranchIcon },
];

export default function PickerBranchExample() {
  const [branches, setBranches] = createSignal(initialBranches);
  const [branch, setBranch] = createSignal<string | null>("picker");
  return (
    <Picker
      label="Branch"
      placeholder="Search branches…"
      items={branches()}
      actions={[{ id: "new-branch", label: "New branch" }]}
      value={branch()}
      onValueChange={setBranch}
      onAction={() => {
        const value = `branch-${branches().length - initialBranches.length + 1}`;
        setBranches([...branches(), { value, label: value, icon: gitBranchIcon }]);
        setBranch(value);
      }}
    />
  );
}
