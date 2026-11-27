import type { StepStatus } from "@kind-ui/agent-ui";
import { defineStepList } from "../../../../src/web/step.js";
import { defineStepGroup } from "../../../../src/web/step-group.js";
import { defineSubagent } from "../../../../src/web/subagent.js";
import { defineTool } from "../../../../src/web/tool.js";
import {
  callOf,
  frames,
  kinds,
  live,
  type StepGroupHandle,
  type StepGroupRow,
  titled,
} from "../../shared/step-group.js";

const define = () => {
  defineStepGroup();
  defineStepList();
  defineTool();
  defineSubagent();
};

const row = (each: StepGroupRow) => {
  if (each.kind === "agent") {
    const el = document.createElement("kind-subagent");
    Object.assign(el, { agentName: each.title, status: each.status, autoOpen: "never" });
    el.innerHTML = `<kind-step-list-item value="${each.id}"><kind-subagent-trigger><button><kind-subagent-icon></kind-subagent-icon><kind-subagent-title></kind-subagent-title><kind-subagent-meta></kind-subagent-meta></button></kind-subagent-trigger></kind-step-list-item><kind-subagent-content><p>Details</p></kind-subagent-content>`;
    return el;
  }
  const el = document.createElement("kind-tool");
  Object.assign(el, { call: callOf(each), status: each.status, heading: each.title, autoOpen: "never" });
  el.canApprove = true;
  el.canDeny = true;
  el.innerHTML = `<kind-step-list-item value="${each.id}"><kind-tool-trigger><button><kind-tool-icon></kind-tool-icon><kind-tool-title></kind-tool-title><kind-tool-meta></kind-tool-meta></button></kind-tool-trigger></kind-step-list-item><kind-tool-content><p>Details</p></kind-tool-content><kind-tool-approval></kind-tool-approval>`;
  return el;
};

const itemsOf = (rows: StepGroupRow[]) =>
  rows.map(({ id, status, kind, target }) => ({ id, status, kind, target }));

const group = (id: string, rows: StepGroupRow[], options: object = {}) => {
  const el = document.createElement("kind-step-group");
  el.id = id;
  Object.assign(el, { items: itemsOf(rows), kinds, ...options });
  const list = document.createElement("kind-step-list");
  list.setAttribute("aria-label", id === "live" ? "Agents" : `${id} steps`);
  list.append(...rows.map(row));
  const content = document.createElement("kind-step-group-content");
  const children = document.createElement("kind-step-group-children");
  children.append(list);
  content.append(children);
  el.append(content);
  return el;
};

const page = (root: HTMLElement, className: string) => {
  const el = document.createElement("div");
  el.className = className;
  root.append(el);
  return el;
};

export const cases = {
  all: (root: HTMLElement) => {
    define();
    page(root, "flex w-[36rem] max-w-full flex-col gap-6 p-6").append(
      ...frames.map((frame) => group(frame.id, frame.rows, frame.options)),
    );
  },
  live: (root: HTMLElement) => {
    define();
    let rows = live;
    const el = group("live", rows, { durationSeconds: 124 });
    const handle: StepGroupHandle = {
      set: (id: string, status: StepStatus) => handle.setAll({ [id]: status }),
      setAll: (statuses) => {
        rows = rows.map((each) => ({ ...each, status: statuses[each.id] ?? each.status }));
        el.items = itemsOf(rows);
        for (const each of rows) {
          const row = el.querySelector(`kind-step-list-item[value="${each.id}"]`)?.closest("kind-subagent");
          if (row) row.status = each.status;
        }
      },
      changes: [],
    };
    el.addEventListener("openchange", (event) =>
      handle.changes.push({ open: event.detail.value, reason: event.detail.reason }),
    );
    const after = document.createElement("button");
    after.type = "button";
    after.textContent = "After";
    page(root, "flex w-[36rem] max-w-full flex-col gap-6 p-6").append(el, after);
    Object.assign(window, { kindStepGroup: handle });
  },
  titles: (root: HTMLElement) => {
    define();
    const tool = (id: string, fields: object) => {
      const el = document.createElement("kind-tool");
      el.id = id;
      Object.assign(el, { autoOpen: "never", ...fields });
      return el;
    };
    page(root, "flex w-[36rem] max-w-full flex-col gap-2 p-6").append(
      tool("titled", { call: titled.running, heading: titled.heading }),
      tool("titled-done", {
        call: { ...titled.running, output: { state: "available", value: "ok" } },
        heading: titled.heading,
      }),
      tool("bare", { call: titled.bare, defaultOpen: true, autoOpen: "running" }),
    );
  },
};
