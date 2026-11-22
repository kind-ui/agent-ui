import { readFileSync } from "node:fs";
import { join } from "node:path";

export const ssrPlugin = () => ({
  name: "kind-fixture-ssr",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname !== "/" || !url.searchParams.has("ssr")) return next();
      try {
        const page = readFileSync(join(server.config.root, "index.html"), "utf8");
        const template = await server.transformIndexHtml(request.url ?? "/", page);
        const { renderCase } = await server.ssrLoadModule("/server.ts");
        const { head, html } = await renderCase(url.searchParams.get("c") ?? "", url.searchParams);
        response.setHeader("content-type", "text/html");
        response.end(
          template
            .replace("</head>", `${head}</head>`)
            .replace('<div id="root"></div>', () => `<div id="root" data-ssr>${html}</div>`),
        );
      } catch (error) {
        server.ssrFixStacktrace(error);
        next(error);
      }
    });
  },
});
