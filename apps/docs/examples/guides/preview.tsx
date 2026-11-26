"use client";
import { type ReactNode, useEffect } from "react";
import { serveChat } from "./demo-server";

/** Renders a guide's chat with its `/api/chat` answered in the browser. */
export default function Preview({
  route,
  children,
}: {
  route: Parameters<typeof serveChat>[0];
  children: ReactNode;
}) {
  useEffect(() => serveChat(route), [route]);
  return children;
}
