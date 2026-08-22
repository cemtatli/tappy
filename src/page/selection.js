export function createSelectionState() {
  return new Set();
}

export function toggleSelection(selected, id) {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function selectAll(ids) {
  return new Set(ids);
}

export function clearSelection() {
  return new Set();
}
