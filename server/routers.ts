import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  archivePublicContent,
  createSuggestion,
  deleteOwnSuggestion,
  listArchivedContent,
  listPublishedContent,
  listSuggestionsForAdmin,
  listSuggestionsForOwner,
  publishSuggestion,
  rejectSuggestion,
  restoreArchivedContent,
} from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const suggestionInput = z
  .object({
    kind: z.enum(["question", "penalty", "tip"]),
    level: z.enum(["hamasat", "nabd", "aamaq", "jawhar"]).optional(),
    body: z.string().trim().min(3, "اكتب محتوى الاقتراح.").max(2000),
    summary: z.string().trim().max(1500).optional(),
    narrator: z.string().trim().max(255).optional(),
    source: z.string().trim().max(500).optional(),
    sourceUrl: z.string().trim().url("أدخل رابط مصدر صحيحاً.").max(2000).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (value.kind === "question" && !value.level) {
      context.addIssue({ code: "custom", message: "اختر مستوى السؤال.", path: ["level"] });
    }
    if (value.kind === "tip" && !value.summary) {
      context.addIssue({ code: "custom", message: "أضف شرحاً موجزاً للنصيحة.", path: ["summary"] });
    }
  });

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  content: router({
    listPublished: publicProcedure.query(() => listPublishedContent()),
    listArchived: adminProcedure.query(() => listArchivedContent()),
    mine: protectedProcedure.query(({ ctx }) => listSuggestionsForOwner(ctx.user.id)),
    suggest: protectedProcedure.input(suggestionInput).mutation(async ({ ctx, input }) => {
      const suggestionId = await createSuggestion(ctx.user.id, {
        ...input,
        sourceUrl: input.sourceUrl || undefined,
      });
      void notifyOwner({
        title: "اقتراح جديد في حديث القلوب",
        content: `أرسل ${ctx.user.name || "مستخدم"} اقتراح ${input.kind === "question" ? "سؤال" : input.kind === "penalty" ? "عقوبة" : "نصيحة"} جديداً للمراجعة.`,
      }).catch(() => undefined);
      return { suggestionId, status: "pending" as const };
    }),
    deleteMine: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await deleteOwnSuggestion(ctx.user.id, input.id);
      if (!deleted) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن حذف هذا الاقتراح." });
      return { success: true } as const;
    }),
    reviewQueue: adminProcedure.input(z.object({ status: z.enum(["pending", "rejected", "published"]).optional() }).optional()).query(({ input }) => listSuggestionsForAdmin(input?.status)),
    reject: adminProcedure.input(z.object({ id: z.number().int().positive(), reviewNote: z.string().trim().max(1500).optional() })).mutation(async ({ ctx, input }) => {
      const updated = await rejectSuggestion(ctx.user.id, input.id, input.reviewNote);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "الاقتراح غير متاح للمراجعة." });
      return { success: true } as const;
    }),
    publish: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const contentItemId = await publishSuggestion(ctx.user.id, input.id);
      if (!contentItemId) throw new TRPCError({ code: "NOT_FOUND", message: "الاقتراح غير متاح للنشر." });
      return { success: true, contentItemId } as const;
    }),
    archivePublic: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const archived = await archivePublicContent(input.id);
      if (!archived) throw new TRPCError({ code: "NOT_FOUND", message: "المحتوى العام غير موجود." });
      return { success: true } as const;
    }),
    restorePublic: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const restored = await restoreArchivedContent(input.id);
      if (!restored) throw new TRPCError({ code: "NOT_FOUND", message: "المحتوى المؤرشف غير موجود." });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
