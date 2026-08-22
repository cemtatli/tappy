// Pure list transforms only. Ids are minted by a counter ref in App, so these
// stay deterministic and testable.
export function addToast(list, toast) {
  return [...list, toast];
}

export function removeToast(list, id) {
  return list.filter((t) => t.id !== id);
}
