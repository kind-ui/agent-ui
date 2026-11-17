"use client";

import { StackTrace } from "@/components/ui/stack-trace";

const stack = `TypeError: Cannot read properties of undefined (reading 'port')
    at readConfig (/app/src/config/read.ts:12:9)
    at loadPlugins (/app/node_modules/plugin-host/dist/index.js:88:14)
    at PluginHost.start (/app/node_modules/plugin-host/dist/host.js:31:5)
    at startServer (/app/src/server.ts:41:3)
    at main (/app/src/index.ts:7:1)
    at Module._compile (node:internal/modules/cjs/loader:1256:14)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)`;

export default function StackTraceExample() {
  return (
    <StackTrace
      stack={stack}
      onOpenFrame={(frame) => console.log("open", frame.file, frame.line)}
      className="w-full max-w-xl"
    />
  );
}
