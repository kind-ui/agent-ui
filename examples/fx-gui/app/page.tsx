import { FxAppClient as FxApp } from "@/components/fx-app-client";

// A local OpenAI-compatible server stands in for AI Gateway in development (`npm run mock`), never in production.
const mockUrl = process.env.NODE_ENV === "development" ? process.env.FX_MOCK_URL : undefined;

export default function Page() {
  return <FxApp mockUrl={mockUrl} />;
}
