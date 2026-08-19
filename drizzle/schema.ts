import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const contentKindValues = ["question", "penalty", "tip"] as const;
export const suggestionStatusValues = ["pending", "rejected", "published"] as const;
export const contentOriginValues = ["original", "suggestion"] as const;
export const levelValues = ["hamasat", "nabd", "aamaq", "jawhar"] as const;

export const contentItems = mysqlTable(
  "contentItems",
  {
    id: int("id").autoincrement().primaryKey(),
    kind: mysqlEnum("kind", contentKindValues).notNull(),
    level: mysqlEnum("level", levelValues),
    body: text("body").notNull(),
    summary: text("summary"),
    narrator: varchar("narrator", { length: 255 }),
    source: varchar("source", { length: 500 }),
    sourceUrl: varchar("sourceUrl", { length: 2000 }),
    origin: mysqlEnum("origin", contentOriginValues).notNull().default("suggestion"),
    isActive: boolean("isActive").notNull().default(true),
    createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("content_public_idx").on(table.kind, table.isActive, table.publishedAt),
    index("content_creator_idx").on(table.createdByUserId),
  ],
);

export const contentSuggestions = mysqlTable(
  "contentSuggestions",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", contentKindValues).notNull(),
    level: mysqlEnum("level", levelValues),
    body: text("body").notNull(),
    summary: text("summary"),
    narrator: varchar("narrator", { length: 255 }),
    source: varchar("source", { length: 500 }),
    sourceUrl: varchar("sourceUrl", { length: 2000 }),
    status: mysqlEnum("status", suggestionStatusValues).notNull().default("pending"),
    reviewNote: text("reviewNote"),
    reviewedByUserId: int("reviewedByUserId").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewedAt"),
    publishedContentId: int("publishedContentId").references(() => contentItems.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("suggestion_owner_status_idx").on(table.ownerId, table.status, table.createdAt),
    index("suggestion_review_queue_idx").on(table.status, table.createdAt),
  ],
);

export const contentPublicationLog = mysqlTable(
  "contentPublicationLog",
  {
    id: int("id").autoincrement().primaryKey(),
    suggestionId: int("suggestionId").notNull().references(() => contentSuggestions.id, { onDelete: "cascade" }),
    contentItemId: int("contentItemId").notNull().references(() => contentItems.id, { onDelete: "cascade" }),
    adminUserId: int("adminUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  },
  table => [
    index("publication_suggestion_idx").on(table.suggestionId),
    index("publication_content_idx").on(table.contentItemId),
  ],
);

export type ContentItem = typeof contentItems.$inferSelect;
export type ContentSuggestion = typeof contentSuggestions.$inferSelect;
