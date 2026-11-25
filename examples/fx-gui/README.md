# fx-gui

A web GUI for the [fx](https://fx.sh) coding agent, built from Agent UI components installed from the live registry (`npx shadcn@latest add @kind-ui/...`). libfx runs in the tab through WebAssembly (`libfx/browser`). Its tools work on an in-browser workspace (just-bash, network off) that starts empty: attach files to start from your own. Writes and shell commands wait for your approval. See [MAPPING.md](MAPPING.md) for how libfx maps to Agent UI.

Live: https://fx-gui.vercel.app

## Connecting a model

Every turn runs on the user's own plan or key. Nothing runs on this deployment's credentials.

- **Sign in with ChatGPT** or **Sign in with Grok**: device-code sign-in through `libfx/chatgpt` and `libfx/grok`. Tokens are kept in an AES-256-GCM sealed, httpOnly, Secure, SameSite=Lax cookie, never in page scripts. The page's libfx sends model requests to `/api/model`, which adds the credentials server-side and forwards them only to the exact endpoints libfx uses for that provider. It refreshes tokens server-side and masks secrets in error bodies.
- **Continue with Vercel** (shown once configured): Sign in with Vercel makes an AI Gateway key on the user's own team, billed to them. The key expires in 7 days and is deleted on sign-out.
- **Your own AI Gateway key**: saved in this browser's localStorage. Each model request carries it through `/api/model`, which uses it for that request only and never stores or logs it. AI Gateway's error responses have no CORS headers, so a direct browser request would hide why a turn failed.

The thread and workspace files are saved in IndexedDB, so a reload keeps them; New session clears them. A turn a reload cut off shows as Stopped.

Needs WebAssembly JSPI (current Chrome, Edge, Firefox and Safari).

## Safety

- `/api/model` never uses a credential of its own: no `AI_GATEWAY_API_KEY` and no Vercel OIDC token. It refuses without a signed-in user.
- State-changing routes require the same Origin and an `x-fx-gui` header.
- Sign-in and model routes are rate-limited per instance, and bodies are capped at 8 MiB.
- Tokens are never logged or returned to the page.
- The page sends a strict CSP (connect only to this site), `frame-ancestors 'none'`, `nosniff`, `no-referrer` and HSTS.
- Workspace paths can't leave `/workspace`.

## Develop

```sh
npm install
echo "FX_GUI_COOKIE_SECRET=$(openssl rand -base64 48)" > .env.local
npm run dev            # http://localhost:6001 (Chrome refuses port 6000)
```

To exercise the agent without a plan, run a local OpenAI-compatible stand-in (development only):

```sh
npm run mock                                   # http://localhost:6002/v1
FX_MOCK_URL=http://localhost:6002/v1 npm run dev
```

## Deploy on Vercel

Project `fx-gui`, Root Directory `examples/fx-gui`.

| Env var | Needed for |
| --- | --- |
| `FX_GUI_COOKIE_SECRET` | Required: 32+ random characters that seal the auth cookies. |
| `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET` | Optional: a Sign in with Vercel app with the **AI Gateway API Keys** (Read and Write) team permission and callback `https://<domain>/api/auth/vercel/callback`. |

Never set `AI_GATEWAY_API_KEY` on the project.
