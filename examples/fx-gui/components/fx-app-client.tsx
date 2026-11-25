"use client";

import dynamic from "next/dynamic";

// libfx's WebAssembly and just-bash's workspace only exist in the browser.
export const FxAppClient = dynamic(() => import("./fx-app").then((module) => module.FxApp), { ssr: false });
