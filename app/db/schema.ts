import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  json,
  serial,
  uuid,
  date,
  time,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";

// Core Tables
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 1024 }).notNull(),
  role: varchar({ length: 50 }).default("user").notNull(),
  allowedPages: json(), // JSON array of page identifiers that the user can access
  timeZone: varchar({ length: 100 }).default("America/Chicago").notNull(), // User's timezone preference
  resetPasswordToken: varchar({ length: 255 }), // Token for password reset
  resetPasswordExpires: timestamp(), // When the reset token expires
  googleCalendarConnected: integer().default(0).notNull(), // Quick sync status flag
  googleCalendarPreferences: json(), // User sync preferences: { syncCalendarColors: boolean, includeDescription: boolean, ... }
  createdAt: timestamp().defaultNow().notNull(),
});

// Tasks Tables
export const tasksTable = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  title: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 1024 }),
  dueDate: timestamp(),
  completedAt: timestamp(),
  category: varchar({ length: 255 }),
  reminderDate: timestamp(), // When to send reminder
  reminderSent: integer().default(0), // 0 = not sent, 1 = sent
  createdAt: timestamp().defaultNow().notNull(),
});

export const taskStepsTable = pgTable("task_steps", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  taskId: integer()
    .notNull()
    .references(() => tasksTable.id),
  description: varchar({ length: 1024 }).notNull(),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Finance Tables
export const financeExpensesTable = pgTable("finance_expenses", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  monthlyCost: integer().notNull(),
  chargeDay: integer().notNull(),
  category: varchar({ length: 255 }).notNull().default("Subscription"),
  accountId: integer("account_id"),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financeIncomeTable = pgTable("finance_income", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  annualGrossIncome: integer().notNull(),
  taxDeductionPercentage: integer().notNull(),
  accountId: integer("account_id"),
  payFrequency: varchar("pay_frequency", { length: 50 })
    .default("monthly")
    .notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Shared Budgets Tables

export const budgetPeriodEnum = pgEnum("budget_period", [
  "monthly",
  "weekly",
  "yearly",
]);
export const budgetRoleEnum = pgEnum("budget_role", ["owner", "contributor"]);
export const budgetMemberStatusEnum = pgEnum("budget_member_status", [
  "active",
  "pending",
  "removed",
]);
export const googleCalendarSyncDirectionEnum = pgEnum(
  "google_calendar_sync_direction",
  ["pull-only", "push-only", "bidirectional"]
);
export const googleCalendarSyncStatusEnum = pgEnum(
  "google_calendar_sync_status",
  ["synced", "pending", "conflict"]
);
export const googleCalendarConflictResolutionEnum = pgEnum(
  "google_calendar_conflict_resolution",
  ["local-wins", "remote-wins", "manual"]
);

export const budgetsTable = pgTable("budgets", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  totalAmount: decimal({ precision: 12, scale: 2 }).notNull(),
  period: budgetPeriodEnum().notNull(),
  createdById: integer()
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const budgetMembersTable = pgTable("budget_members", {
  id: uuid().primaryKey().defaultRandom(),
  budgetId: uuid()
    .notNull()
    .references(() => budgetsTable.id),
  userId: integer().references(() => usersTable.id), // nullable for pending invites
  email: varchar({ length: 255 }).notNull(),
  role: budgetRoleEnum().notNull(),
  status: budgetMemberStatusEnum().notNull().default("pending"),
  invitedAt: timestamp().defaultNow().notNull(),
  joinedAt: timestamp(),
});

export const budgetTransactionsTable = pgTable("budget_transactions", {
  id: uuid().primaryKey().defaultRandom(),
  budgetId: uuid()
    .notNull()
    .references(() => budgetsTable.id),
  addedById: integer()
    .notNull()
    .references(() => usersTable.id),
  amount: decimal({ precision: 12, scale: 2 }).notNull(),
  description: varchar({ length: 1024 }),
  category: varchar({ length: 255 }),
  transactionDate: date().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// Notes & Folders Tables
export const foldersTable = pgTable("folders", {
  id: serial().primaryKey(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const notesTable = pgTable("notes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  folderId: integer().references(() => foldersTable.id), // nullable for notes not in a folder
  title: varchar({ length: 255 }).notNull(),
  content: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Utilities Tables
export const utilitiesCommandsTable = pgTable("utilities_commands", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  title: varchar({ length: 255 }).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const utilitiesCommandsVersionsTable = pgTable(
  "utilities_commands_versions",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id),
    commandId: integer()
      .notNull()
      .references(() => utilitiesCommandsTable.id),
    version: integer().notNull(),
    command: varchar({ length: 4096 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  }
);

// Day Planner Tables

export const dayPlansTable = pgTable("day_plans", {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  planDate: date().notNull(), // The specific date this plan is for
  timeZone: varchar({ length: 100 }).notNull().default("America/Chicago"), // Timezone for this plan
  viewStartTime: time().notNull().default("06:00:00"), // Calendar view start (visual only)
  viewEndTime: time().notNull().default("22:00:00"), // Calendar view end (visual only)
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const dayPlanSectionsTable = pgTable("day_plan_sections", {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  planId: uuid()
    .notNull()
    .references(() => dayPlansTable.id),
  title: varchar({ length: 255 }).notNull(), // Task title/name
  description: text(), // Detailed description (nullable)
  startTime: time().notNull(), // Task start time
  durationMinutes: integer().notNull().default(30), // Task duration (15, 30, 60, or custom)
  color: varchar({ length: 50 }).notNull().default("indigo"), // Task color (indigo, blue, purple, pink, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky)
  completedAt: timestamp(), // When marked complete (nullable)
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Google Calendar Tables

export const googleCalendarAccountsTable = pgTable("google_calendar_accounts", {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .unique()
    .references(() => usersTable.id),
  googleAccountEmail: varchar({ length: 255 }).notNull(),
  googleCalendarId: varchar({ length: 255 }).notNull(), // primary calendar ID from Google
  accessToken: varchar({ length: 2048 }).notNull(), // encrypted
  refreshToken: varchar({ length: 2048 }).notNull(), // encrypted
  tokenExpiresAt: timestamp().notNull(),
  isSyncEnabled: integer().default(1).notNull(),
  syncDirection: googleCalendarSyncDirectionEnum()
    .default("bidirectional")
    .notNull(),
  lastSyncAt: timestamp(),
  connectedAt: timestamp().defaultNow().notNull(),
  disconnectedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

export const dayPlannerGoogleSyncMappingTable = pgTable(
  "day_planner_google_sync_mapping",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id),
    dayPlanSectionId: uuid()
      .notNull()
      .references(() => dayPlanSectionsTable.id),
    googleEventId: varchar({ length: 255 }).notNull(),
    googleCalendarId: varchar({ length: 255 }).notNull(),
    localLastModified: timestamp(),
    googleLastModified: timestamp(),
    syncStatus: googleCalendarSyncStatusEnum()
      .default("synced")
      .notNull(),
    conflictResolution: googleCalendarConflictResolutionEnum(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  }
);

