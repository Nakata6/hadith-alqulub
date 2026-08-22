export function canConfirmArchive(targetId: number | null, isPending: boolean) {
  return targetId !== null && !isPending;
}

export function canConfirmRestore(targetId: number | null, isPending: boolean) {
  return targetId !== null && !isPending;
}
