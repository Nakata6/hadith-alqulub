export type SuggestionStatus = "pending" | "rejected" | "published";
export type AccountRole = "user" | "admin";

export function canOwnerDeleteSuggestion(status: SuggestionStatus) {
  return status === "pending" || status === "rejected";
}

export function canReviewSuggestion(role: AccountRole, status: SuggestionStatus) {
  return role === "admin" && status === "pending";
}

export function canViewPrivateSuggestion(input: {
  ownerId: number;
  viewerId?: number;
  viewerRole?: AccountRole;
}) {
  return input.viewerRole === "admin" || input.viewerId === input.ownerId;
}
