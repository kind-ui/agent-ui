import { enter, exit, layout } from "@kind-ui/agent-ui/core";

// The motion helper is framework-free; the fixture exposes it to drive a plain element.
Object.assign(window, { kindMotion: { enter, exit, layout } });

export const cases = {
  box: (root: HTMLElement) => {
    const box = document.createElement("div");
    box.id = "box";
    box.className = "h-16 w-16 bg-[rgb(1,2,3)]";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.dataset.dot = "";
      dot.textContent = ".";
      box.append(dot);
    }
    root.append(box);
  },
};
