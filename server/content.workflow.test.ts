import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createSuggestion: vi.fn(),
  deleteOwnSuggestion: vi.fn(),
  listPublishedContent: vi.fn(),
  listSuggestionsForAdmin: vi.fn(),
  listSuggestionsForOwner: vi.fn(),
  publishSuggestion: vi.fn(),
  rejectSuggestion: vi.fn(),
  archivePublicContent: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", () => ({
  createSuggestion: mocks.createSuggestion,
  deleteOwnSuggestion: mocks.deleteOwnSuggestion,
  listPublishedContent: mocks.listPublishedContent,
  listSuggestionsForAdmin: mocks.listSuggestionsForAdmin,
  listSuggestionsForOwner: mocks.listSuggestionsForOwner,
  publishSuggestion: mocks.publishSuggestion,
  rejectSuggestion: mocks.rejectSuggestion,
  archivePublicContent: mocks.archivePublicContent,
}));

vi.mock("./_core/notification", () => ({ notifyOwner: mocks.notifyOwner }));

import { appRouter } from "./routers";
import { ENV } from "./_core/env";

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const regularUser = {
  id: 7, openId: "user-7", name: "سارة", email: "sara@example.com", loginMethod: "manus", role: "user" as const,
  createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
};

const adminUser = { ...regularUser, id: 1, openId: ENV.ownerOpenId, role: "admin" as const };

describe("مسار نشر اقتراح المحتوى", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSuggestion.mockResolvedValue(44);
    mocks.notifyOwner.mockResolvedValue(true);
    mocks.publishSuggestion.mockResolvedValue(91);
    mocks.listPublishedContent.mockResolvedValue([{ id: 91, kind: "question", level: "hamasat", body: "ما أجمل ذكرى قريبة لقلبك؟", isActive: true }]);
  });

  it("يحفظ اقتراح المستخدم كمعلق، ثم ينشره المدير ليصبح ظاهراً في المحتوى العام", async () => {
    const userCaller = appRouter.createCaller(contextFor(regularUser));
    const created = await userCaller.content.suggest({ kind: "question", level: "hamasat", body: "ما أجمل ذكرى قريبة لقلبك؟" });
    expect(created).toEqual({ suggestionId: 44, status: "pending" });
    expect(mocks.createSuggestion).toHaveBeenCalledWith(7, expect.objectContaining({ kind: "question", level: "hamasat" }));
    expect(mocks.notifyOwner).toHaveBeenCalledOnce();

    const adminCaller = appRouter.createCaller(contextFor(adminUser));
    await expect(adminCaller.content.publish({ id: 44 })).resolves.toEqual({ success: true, contentItemId: 91 });
    await expect(userCaller.content.listPublished()).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 91 })]));
  });
});
