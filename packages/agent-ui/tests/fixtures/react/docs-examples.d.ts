// Docs examples import `@/components/ui/*` without extensions, so the docs build type-checks them, not this project.
declare module "@docs/examples/agents/webmcp" {
  const WebMCPDemo: () => import("react").ReactElement;
  export default WebMCPDemo;
}
