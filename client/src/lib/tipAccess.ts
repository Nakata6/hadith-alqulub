export function canAccessTipLibrary(role: string | null | undefined) {
  return role === "admin";
}
