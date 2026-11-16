import type { Source } from "../../types/index.js";
import { sanitizeUrl } from "../markdown/index.js";

/** A source as the list shows it. */
export type SourceEntry = {
  title: string;
  /** The `url` when it's safe to link to (`http`, `https`, `mailto` or relative), else `undefined`. */
  url: string | undefined;
  /** The URL's host name without `www.`, or empty. An international domain shows as punycode, which can't pass for another. */
  host: string;
  snippet: string;
  /** The `favicon`. An image source runs no script, so it isn't checked as a link is. */
  favicon: string | undefined;
  /** The first letter of the host name, else of the title, which the icon shows until a `favicon` loads. */
  initial: string;
};

const hostName = (url: string | undefined): string => {
  if (!url) return "";
  try {
    // A relative URL throws, and has no host; a protocol-relative one has one.
    return new URL(url.startsWith("//") ? `https:${url}` : url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** A source as the list shows it: its link only when safe, and the host name and initial read from it. */
export const sourceEntry = (source: Source): SourceEntry => {
  const url = (source.url && sanitizeUrl(source.url)) || undefined;
  const host = hostName(url);
  return {
    title: source.title,
    url,
    host,
    snippet: source.snippet ?? "",
    favicon: source.favicon || undefined,
    initial: [...(host || source.title.trim())][0]?.toUpperCase() ?? "?",
  };
};
