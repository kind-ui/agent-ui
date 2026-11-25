# fx in your browser (spike, don't merge)

A web GUI for the [fx](https://fx.sh) coding agent, built from Agent UI components installed from the live registry (`npx shadcn@latest add @kind-ui/...`), as any app would. libfx runs in the tab through WebAssembly (`libfx/browser`), and its tools work on an in-browser workspace (just-bash), so there's no server. See [MAPPING.md](MAPPING.md) for how libfx maps to Agent UI.

- **Replay:** a scripted turn that needs no key. Its tool calls run for real against the workspace, and writes wait for your approval.
- **AI Gateway key:** your key stays in the page's memory and goes straight to AI Gateway. Nothing is stored or proxied.

Needs a browser with WebAssembly JSPI for key mode (Chrome, Edge, Firefox 159+, Safari 27+). Replay works anywhere.

```sh
npm install
npm run dev            # http://localhost:6001 (Chrome refuses port 6000)
```

To test key mode without a key, run a mock model and point the dev server at it:

```sh
npm run mock                                   # http://localhost:6002/v1
FX_MOCK_URL=http://localhost:6002/v1 npm run dev
```

## Deploy on Vercel

Live at https://fx-gui.vercel.app (Vercel project `fx-gui`).


1. Import the repository and set **Root Directory** to `examples/fx-gui` (framework: Next.js, detected).
2. No environment variables. Don't add `AI_GATEWAY_API_KEY`: the app never uses a server key.
3. `vercel.json` serves `fx-core.wasm` as `application/wasm`.

From the CLI: `cd examples/fx-gui && npx vercel link --project fx-gui`, then `npx vercel deploy --prod`.
