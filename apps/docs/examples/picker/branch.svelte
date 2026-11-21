<script lang="ts">
  import { Picker, type PickerChoice } from "@/components/ui/svelte/picker/index.js";

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

  let branches = $state.raw(initialBranches);
  let branch = $state<string | null>("picker");

  function addBranch() {
    const value = `branch-${branches.length - initialBranches.length + 1}`;
    branches = [...branches, { value, label: value, icon: gitBranchIcon }];
    branch = value;
  }
</script>

{#snippet gitBranchIcon()}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
{/snippet}

<Picker
  label="Branch"
  placeholder="Search branches…"
  items={branches}
  actions={[{ id: "new-branch", label: "New branch" }]}
  bind:value={branch}
  onAction={addBranch}
/>
