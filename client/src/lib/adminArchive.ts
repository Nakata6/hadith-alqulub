export function canConfirmArchive(targetId: number | null, isPending: boolean) {
  return targetId !== null && !isPending;
}
