import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineJobProgress } from "../../../../src/web/job-progress.js";
import { clockJob, type JobHost, jobHost, jobs, LOG } from "../../shared/job-progress.js";

const { host, call } = jobHost();

const page =
  ({ motion }: { motion?: MotionMode } = {}) =>
  (root: HTMLElement) => {
    defineJobProgress();
    const list = document.createElement("div");
    list.className = "flex w-[30rem] flex-col gap-4 p-6";
    const elements = jobs.map((job) => {
      const el = document.createElement("kind-job-progress");
      el.id = job.id;
      if (job.log) {
        const content = document.createElement("kind-job-progress-content");
        const log = document.createElement("pre");
        log.textContent = LOG.join("\n");
        content.append(log);
        el.append(content);
      }
      Object.assign(el, job.options);
      if (motion) el.motion = motion;
      if (job.cancel) {
        el.canCancel = true;
        el.addEventListener("jobcancel", (event) => event.detail.waitUntil(call("cancel")()));
      }
      if (job.retry) {
        el.canRetry = true;
        el.addEventListener("jobretry", (event) => event.detail.waitUntil(call("retry")()));
      }
      return el;
    });
    list.append(...elements);
    root.append(list);
    const set: JobHost["set"] = (id, options) => {
      const el = elements.find((element) => element.id === id);
      if (el) Object.assign(el, options);
    };
    Object.assign(window, { kindHost: Object.assign(host, { set }) });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  clock: (root: HTMLElement) => {
    defineJobProgress();
    const el = document.createElement("kind-job-progress");
    el.id = "clock";
    Object.assign(el, clockJob());
    const wrap = document.createElement("div");
    wrap.className = "w-[30rem] p-6";
    wrap.append(el);
    root.append(wrap);
  },
};
