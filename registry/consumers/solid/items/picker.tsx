import { Picker } from "../components/ui/solid/picker.js";

export default function PickerItem() {
  return (
    <Picker
      label="Branch"
      defaultValue="main"
      items={[
        { value: "main", label: "main" },
        { value: "dev", label: "dev" },
      ]}
    />
  );
}
