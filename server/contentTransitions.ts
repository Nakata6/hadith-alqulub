export function rejectedSuggestionUpdate(adminUserId: number, reviewNote?: string, reviewedAt = new Date()) {
  return {
    status: "rejected" as const,
    reviewNote: reviewNote || null,
    reviewedByUserId: adminUserId,
    reviewedAt,
  };
}

export function publishedSuggestionUpdate(adminUserId: number, contentItemId: number, reviewedAt = new Date()) {
  return {
    status: "published" as const,
    reviewedByUserId: adminUserId,
    reviewedAt,
    publishedContentId: contentItemId,
  };
}

export function publicationLogEntry(suggestionId: number, contentItemId: number, adminUserId: number) {
  return { suggestionId, contentItemId, adminUserId };
}
