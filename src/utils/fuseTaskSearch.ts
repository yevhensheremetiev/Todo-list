import Fuse from "fuse.js";
import type { MatchIndexRange } from "./search.ts";

type Options = {
  includeMatches?: boolean;
  shouldSort?: boolean;
};

export function fuseSearchTasksByTitle<T extends { id: string; title: string }>(
  tasks: readonly T[],
  query: string,
  options: Options = {},
): { items: T[]; matchIndicesById: Map<string, readonly MatchIndexRange[]> } {
  const q = query.trim();
  const matchIndicesById = new Map<string, readonly MatchIndexRange[]>();
  if (!q) return { items: [...tasks], matchIndicesById };

  const fuse = new Fuse(tasks as T[], {
    keys: ["title"],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeMatches: options.includeMatches ?? false,
    shouldSort: options.shouldSort ?? true,
  });

  const results = fuse.search(q);
  const items: T[] = [];
  for (const r of results) {
    items.push(r.item);
    if (options.includeMatches) {
      const titleMatch = r.matches?.find((m) => m.key === "title");
      const indices = (titleMatch?.indices ??
        []) as unknown as MatchIndexRange[];
      matchIndicesById.set(r.item.id, indices);
    }
  }

  return { items, matchIndicesById };
}

