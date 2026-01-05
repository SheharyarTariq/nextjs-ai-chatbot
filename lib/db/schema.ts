import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

// Event enums
export const eventTypeEnum = pgEnum("event_type", [
  "Run",
  "Yoga",
  "Strength",
  "Mobility",
  "HIIT",
  "Recovery",
  "Others",
]);

export const eventIntensityEnum = pgEnum("event_intensity", [
  "High",
  "Medium",
  "Low",
]);


export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 64 }),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  gender: varchar("gender", { length: 10 }),
  birthDay: integer("birthDay"),
  birthMonth: integer("birthMonth"),
  birthYear: integer("birthYear"),
  country: varchar("country", { length: 30 }),
  city: varchar("city", { length: 100 }).default("Dubai"),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
  lastContext: jsonb("lastContext").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const agenda = pgTable("Agenda", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  goal: text("goal").notNull(),
  startDate: timestamp("startDate").notNull(),
  currentWeek: integer("currentWeek").notNull().default(1),
  totalWeeks: integer("totalWeeks").notNull().default(12),
  trainingFrequency: integer("trainingFrequency"),
  injuries: text("injuries"),
  workType: varchar("workType", { length: 50 }),
  userData: jsonb("userData").$type<{
    name?: string;
    gender?: string;
    age?: number;
    weight?: number;
    height?: number;
    heartRateZones?: any;
  }>(),
  weeklyData: jsonb("weeklyData").$type<Array<{
    weekNumber: number;
    sessions: Array<{
      day: string;
      date: string;
      completed: boolean;
      rating?: number;
      meals?: number;
      sleep?: number;
      energy?: number;
      notes?: string;
      currentDayNumber?: number;
      totalTrainingDays?: number;
      exerciseDetails?: string;
      mealDetails?: string;
      sleepDetails?: string;
    }>;
  }>>(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type Agenda = InferSelectModel<typeof agenda>;

export const book = pgTable("Book", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  uploadDate: timestamp("uploadDate").notNull().defaultNow(),
  size: varchar("size", { length: 32 }),
  type: varchar("type", { length: 16 }).notNull().default("pdf"),
  processingStatus: varchar("processingStatus", {
    enum: ["queued", "processing", "completed", "failed"]
  }).notNull().default("queued"),
  textContent: text("textContent"),
  totalChunks: integer("totalChunks"),
  processedChunks: integer("processedChunks"),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Book = InferSelectModel<typeof book>;

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => book.id, { onDelete: 'cascade' }),
  chunkIndex: integer("chunk_index").notNull(),
  originalText: text("original_text").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(), // Vector column for pgvector embeddings
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Embedding = InferSelectModel<typeof embeddings>;

export const event = pgTable("Event", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  title: varchar("title", { length: 50 }).notNull(),
  location: text("location").notNull(),
  locationLat: varchar("locationLat", { length: 50 }).notNull(),
  locationLng: varchar("locationLng", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  duration: integer("duration").notNull(),
  type: eventTypeEnum("type").notNull(),
  intensity: eventIntensityEnum("intensity").notNull(),
  participantCount: integer("participantCount").notNull().default(0),
  host: varchar("host", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Event = InferSelectModel<typeof event>;

export const userEvent = pgTable(
  "UserEvent",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    eventId: uuid("eventId")
      .notNull()
      .references(() => event.id, { onDelete: 'cascade' }),
    joinedAt: timestamp("joinedAt").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserEvent: uniqueIndex("unique_user_event_idx").on(table.userId, table.eventId),
  })
);

export type UserEvent = InferSelectModel<typeof userEvent>;

export type EventType = "Run" | "Yoga" | "Strength" | "Mobility" | "HIIT" | "Recovery" | "Others";
export type EventIntensity = "High" | "Medium" | "Low";

export const prompt = pgTable("Prompt", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().default("System Prompt"),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => user.id),
});

export type Prompt = InferSelectModel<typeof prompt>;
