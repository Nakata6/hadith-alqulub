import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contentItems,
  contentPublicationLog,
  contentSuggestions,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { publicationLogEntry, publishedSuggestionUpdate, rejectedSuggestionUpdate } from "./contentTransitions";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type SuggestionInput = {
  kind: "question" | "penalty" | "tip";
  level?: "hamasat" | "nabd" | "aamaq" | "jawhar";
  body: string;
  summary?: string;
  narrator?: string;
  source?: string;
  sourceUrl?: string;
};

function requireDatabase<T>(db: T | null): T {
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  return db;
}

export async function listPublishedContent() {
  const db = requireDatabase(await getDb());
  return db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.isActive, true)))
    .orderBy(asc(contentItems.kind), desc(contentItems.publishedAt));
}

export async function listSuggestionsForOwner(ownerId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select()
    .from(contentSuggestions)
    .where(eq(contentSuggestions.ownerId, ownerId))
    .orderBy(desc(contentSuggestions.createdAt));
}

export async function createSuggestion(ownerId: number, input: SuggestionInput) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(contentSuggestions).values({
    ownerId,
    kind: input.kind,
    level: input.level,
    body: input.body,
    summary: input.summary || null,
    narrator: input.narrator || null,
    source: input.source || null,
    sourceUrl: input.sourceUrl || null,
    status: "pending",
  });
  return Number((result as unknown as { insertId?: number }).insertId ?? 0);
}

export async function deleteOwnSuggestion(ownerId: number, suggestionId: number) {
  const db = requireDatabase(await getDb());
  const result = await db
    .delete(contentSuggestions)
    .where(
      and(
        eq(contentSuggestions.id, suggestionId),
        eq(contentSuggestions.ownerId, ownerId),
        inArray(contentSuggestions.status, ["pending", "rejected"]),
      ),
    );
  return Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function listSuggestionsForAdmin(status?: "pending" | "rejected" | "published") {
  const db = requireDatabase(await getDb());
  const query = db
    .select({
      suggestion: contentSuggestions,
      ownerName: users.name,
      ownerEmail: users.email,
    })
    .from(contentSuggestions)
    .innerJoin(users, eq(contentSuggestions.ownerId, users.id));

  return status
    ? query.where(eq(contentSuggestions.status, status)).orderBy(asc(contentSuggestions.createdAt))
    : query.orderBy(asc(contentSuggestions.createdAt));
}

export async function rejectSuggestion(adminUserId: number, suggestionId: number, reviewNote?: string) {
  const db = requireDatabase(await getDb());
  const result = await db
    .update(contentSuggestions)
    .set(rejectedSuggestionUpdate(adminUserId, reviewNote))
    .where(and(eq(contentSuggestions.id, suggestionId), eq(contentSuggestions.status, "pending")));
  return Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

export async function publishSuggestion(adminUserId: number, suggestionId: number) {
  const db = requireDatabase(await getDb());
  return db.transaction(async tx => {
    const suggestions = await tx
      .select()
      .from(contentSuggestions)
      .where(and(eq(contentSuggestions.id, suggestionId), eq(contentSuggestions.status, "pending")))
      .limit(1);
    const suggestion = suggestions[0];
    if (!suggestion) return null;

    const inserted = await tx
      .insert(contentItems)
      .values({
        kind: suggestion.kind,
        level: suggestion.level,
        body: suggestion.body,
        summary: suggestion.summary,
        narrator: suggestion.narrator,
        source: suggestion.source,
        sourceUrl: suggestion.sourceUrl,
        origin: "suggestion",
        isActive: true,
        createdByUserId: suggestion.ownerId,
        publishedAt: new Date(),
      })
      .$returningId();
    const contentItemId = inserted[0]?.id;
    if (!contentItemId) throw new Error("تعذر نشر المحتوى المقترح.");

    await tx
      .update(contentSuggestions)
      .set(publishedSuggestionUpdate(adminUserId, contentItemId))
      .where(and(eq(contentSuggestions.id, suggestionId), eq(contentSuggestions.status, "pending")));
    await tx.insert(contentPublicationLog).values(publicationLogEntry(suggestionId, contentItemId, adminUserId));
    return contentItemId;
  });
}

export async function archivePublicContent(contentItemId: number) {
  const db = requireDatabase(await getDb());
  const result = await db
    .update(contentItems)
    .set({ isActive: false })
    .where(eq(contentItems.id, contentItemId));
  return Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0) > 0;
}
