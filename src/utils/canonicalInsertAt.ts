export function canonicalInsertAt(params: {
  fullIds: readonly string[];
  visibleIds: readonly string[];
  gapIndexInVisibleList: number;
  fullIndexById?: ReadonlyMap<string, number>;
}): number {
  const { fullIds, visibleIds, gapIndexInVisibleList, fullIndexById } = params;

  if (visibleIds.length === 0) return 0;
  const clamped = Math.max(0, Math.min(gapIndexInVisibleList, visibleIds.length));

  const getIndex = (id: string): number => {
    if (fullIndexById) return fullIndexById.get(id) ?? 0;
    return fullIds.indexOf(id);
  };

  if (clamped === 0) return getIndex(visibleIds[0]);
  if (clamped === visibleIds.length)
    return getIndex(visibleIds[visibleIds.length - 1]) + 1;

  return getIndex(visibleIds[clamped]);
}

