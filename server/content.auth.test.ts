import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("حماية راوتر المحتوى", () => {
  it("يمنع الضيف من قراءة اقتراحاته الخاصة", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.content.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("يمنع المستخدم العادي من فتح قائمة مراجعة المدير", async () => {
    const caller = appRouter.createCaller(contextFor({
      id: 21,
      openId: "normal-user",
      name: "مستخدم",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));
    await expect(caller.content.reviewQueue({ status: "pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يمنع حساب مدير غير مالك المشروع من فتح قائمة المراجعة", async () => {
    const caller = appRouter.createCaller(contextFor({
      id: 22, openId: `${ENV.ownerOpenId}-different`, name: "مدير آخر", email: "other-admin@example.com", loginMethod: "manus", role: "admin",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    }));
    await expect(caller.content.reviewQueue({ status: "pending" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
