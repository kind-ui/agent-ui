"use client";
import { useState } from "react";
import { Picker } from "@/components/ui/picker";

function GitBranchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

const initialBranches = [
  { value: "main", label: "main", icon: <GitBranchIcon /> },
  {
    value: "picker",
    label: "picker",
    description: "Add the Picker component",
    meta: "↑3 ↓1",
    icon: <GitBranchIcon />,
  },
  { value: "menus", label: "menus", meta: "↑1 ↓4", icon: <GitBranchIcon /> },
];

export default function PickerBranchExample() {
  const [branches, setBranches] = useState(initialBranches);
  const [branch, setBranch] = useState<string | null>("picker");
  return (
    <Picker
      label="Branch"
      placeholder="Search branches…"
      items={branches}
      actions={[{ id: "new-branch", label: "New branch" }]}
      value={branch}
      onValueChange={setBranch}
      onAction={() => {
        const value = `branch-${branches.length - initialBranches.length + 1}`;
        setBranches([...branches, { value, label: value, icon: <GitBranchIcon /> }]);
        setBranch(value);
      }}
    />
  );
}
