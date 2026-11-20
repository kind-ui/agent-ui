import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineThreadSearch } from "../../../../src/web/thread-search.js";
import { NOW, results, threadSearchHost, threads } from "../../shared/thread-search.js";

const { host, record } = threadSearchHost();

type Detail = { value: string; reason: string; source?: string };
const listen = (el: HTMLElement, type: string, name: string, refusing = false) =>
  el.addEventListener(type, (event) => {
    record(name)((event as CustomEvent<Detail>).detail.value, (event as CustomEvent<Detail>).detail);
    if (refusing) event.preventDefault();
  });

const page =
  ({
    motion,
    presentation,
    refusing,
  }: {
    motion?: MotionMode;
    presentation?: "sheet";
    refusing?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineThreadSearch();
    const wrapper = Object.assign(document.createElement("div"), { className: "flex flex-col gap-4 p-6" });
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const search = document.createElement("kind-thread-search");
    search.id = "search";
    search.threads = threads;
    search.now = NOW;
    search.timeZone = "UTC";
    search.shortcut = "mod+k";
    search.canSelect = true;
    search.canNew = true;
    if (motion) search.motion = motion;
    if (presentation) search.presentation = presentation;
    listen(search, "threadselect", "select", refusing);
    listen(search, "threadnew", "new");
    listen(search, "threadquerychange", "query");
    wrapper.append(above, search);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

const server = (root: HTMLElement) => {
  defineThreadSearch();
  const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
  const search = document.createElement("kind-thread-search");
  search.id = "search";
  search.threads = results;
  search.now = NOW;
  search.filter = false;
  search.status = "loading";
  search.canSelect = true;
  listen(search, "threadselect", "select");
  listen(search, "threadquerychange", "query");
  wrapper.append(search);
  root.append(wrapper);
  Object.assign(window, {
    kindHost: { ...host, setStatus: (status: "idle" | "loading" | "error") => (search.status = status) },
  });
};

const owned = (root: HTMLElement) => {
  defineThreadSearch();
  const search = document.createElement("kind-thread-search");
  search.id = "search";
  search.threads = threads;
  search.now = NOW;
  search.query = "";
  listen(search, "threadquerychange", "query");
  root.append(Object.assign(document.createElement("div"), { className: "p-6" }));
  root.firstElementChild?.append(search);
  Object.assign(window, { kindHost: host });
};

export const cases = {
  owned,
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
  sheet: page({ presentation: "sheet" }),
  server,
};
