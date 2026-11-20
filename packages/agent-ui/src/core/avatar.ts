const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * The first character of each of the first two words of `name` that start with a letter or digit, in upper case,
 * or "?" when there are none. A character whose upper case is longer, like "ß", stays as it is.
 */
export const avatarInitials = (name: string): string =>
  (name.match(/[\p{L}\p{N}]\S*/gu) ?? [])
    .slice(0, 2)
    .map((word) => {
      const segment = graphemes.segment(word).containing(0)?.segment ?? word;
      const upper = segment.toUpperCase();
      return upper.length === segment.length ? upper : segment;
    })
    .join("") || "?";
