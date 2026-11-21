import { getCurrentInstance } from "vue";

export function useFlush() {
  const instance = getCurrentInstance();
  if (!instance) throw new Error("useFlush must be called in setup.");
  return (change: () => void) => {
    change();
    instance.update();
  };
}
