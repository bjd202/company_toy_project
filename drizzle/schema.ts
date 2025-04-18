// drizzle/schema.ts
import { relations } from "drizzle-orm";
import { date, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(), // bcrypt 해시 저장 예정
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quoteCache = pgTable("quote_cache", {
  id: serial("id").primaryKey(),
  date: date("date").unique().notNull(), // 오늘 날짜
  quoteId: integer("quote_id").references(() => quotes.id, {onDelete: "cascade"}),
});

export const quoteCacheRelations = relations(quoteCache, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteCache.quoteId],
    references: [quotes.id],
  }),
}));

export const snacks = pgTable("snacks", {
  id: serial("id").primaryKey(),
  name: varchar("name", {length: 255}).notNull().unique(),
  expireDate: date("expire_date"),
  quantity: integer("quantity").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdId: integer("created_id").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedId: integer("updated_id").references(() => users.id),
});

export const snacksRelations = relations(snacks, ({ one }) => ({
  createdId: one(users, {
    fields: [snacks.createdId],
    references: [users.id],
  }),
  updatedId: one(users, {
    fields: [snacks.updatedId],
    references: [users.id],
  }),
}));

export const snackRequests = pgTable("snack_requests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),             // 요청 간식 이름
  quantity: integer("quantity").notNull().default(1),           // 요청 수량
  reason: text("reason"),                                       // 요청 사유 (optional)
  url: text("url"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 요청 상태: pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  createdId: integer("created_id").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
  approvedBy: integer("approved_id").references(() => users.id), // 승인자 (nullable)
});

export const snackLogs = pgTable("snack_logs", {
  id: serial("id").primaryKey(),
  snack_id: integer("snack_id").notNull().references(() => snacks.id),
  action: varchar("action", {length: 20}).notNull(),
  changeQuantity: integer("change_quantity"),
  beforeQuantity: integer("before_quantity"),
  afterQuantity: integer("after_quantity"),
  userId: integer("userId").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});