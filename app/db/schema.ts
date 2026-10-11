import {
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  varchar,
  text,
  json,
  jsonb,
  serial,
  uuid,
  date,
  time,
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
  dashboardPreferences: json(), // Dashboard preferences: { layout: string, visibleWidgets: string[], goals: {...}, refreshInterval: number, ... }
  featureOverrides: json(), // Per-user feature toggles: { "tasks": "disabled", ... } — wins over platform defaults
  navigationPreferences: json(), // Per-user navigation prefs: { mobileTabIds: ["tasks", ...] } — pages pinned to the mobile bottom bar (max 4, see app/modules/navigation.ts)
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
  recurrenceFrequency: varchar("recurrence_frequency", { length: 20 }).default("monthly").notNull(),
  recurrenceAnchor: date("recurrence_anchor").default("2000-01-01").notNull(),
  lastDayOfMonth: integer("last_day_of_month").default(0).notNull(),
  necessity: varchar({ length: 20 }).default("essential").notNull(),
  costType: varchar("cost_type", { length: 20 }).default("fixed").notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).default("autopay").notNull(),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Ledger of actual charge occurrences; one record per expense per scheduled charge date. */
export const financeExpenseChargesTable = pgTable(
  "finance_expense_charges",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(() => usersTable.id),
    expenseId: integer("expense_id")
      .notNull()
      .references(() => financeExpensesTable.id, { onDelete: "cascade" }),
    chargeDate: date("charge_date").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("finance_expense_charges_expense_date_unique").on(table.expenseId, table.chargeDate),
    index("finance_expense_charges_user_id_idx").on(table.userId),
  ]
);

export const financePaymentAccountsTable = pgTable("finance_payment_accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financeAccountBalanceSnapshotsTable = pgTable(
  "finance_account_balance_snapshots",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().references(() => usersTable.id),
    accountId: integer("account_id").notNull(),
    balanceDate: date("balance_date").notNull(),
    balanceCents: integer("balance_cents").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Postgres truncates identifiers at 63 chars; the auto-generated name for
    // this FK is 75, so drizzle-kit could never match the stored name and
    // recreated the constraint (and the UNIQUE below) on every push. Name it
    // explicitly and keep it short.
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [financePaymentAccountsTable.id],
      name: "fabs_account_id_fk",
    }).onDelete("cascade"),
    unique("finance_account_balance_snapshots_account_date_unique").on(table.accountId, table.balanceDate),
    index("finance_account_balance_snapshots_user_id_idx").on(table.userId),
  ]
);

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

/** Optional primary schedule; separate from income totals so legacy income rows remain unscheduled. */
export const financePaySchedulesTable = pgTable("finance_pay_schedules", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id),
  isEnabled: integer("is_enabled").default(0).notNull(),
  scheduleType: varchar("schedule_type", { length: 30 }).default("semi-monthly").notNull(),
  firstNominalDay: integer("first_nominal_day").default(15).notNull(),
  secondPaydayRule: varchar("second_payday_rule", { length: 30 }).default("last-day").notNull(),
  weekendAdjustment: varchar("weekend_adjustment", { length: 30 }).default("previous-friday").notNull(),
  netPaycheckAmountCents: integer("net_paycheck_amount_cents"),
  depositAccountId: integer("deposit_account_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  totalAmountCents: integer("total_amount_cents").notNull(),
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
  amountCents: integer("amount_cents").notNull(),
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
  isEncrypted: integer().default(0).notNull(), // 0 = not encrypted, 1 = encrypted (for backward compatibility)
  encryptionMetadata: json(), // Stores encryption metadata: { version: number, algorithm: string, ... } for future key rotation
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
    dayPlanSectionId: uuid().notNull(),
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
  },
  (table) => [
    // Auto-generated name is 72 chars and gets truncated by Postgres.
    foreignKey({
      columns: [table.dayPlanSectionId],
      foreignColumns: [dayPlanSectionsTable.id],
      name: "dpg_section_id_fk",
    }),
  ]
);

// Calendar Preferences Table
export const calendarPreferencesTable = pgTable("calendar_preferences", {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .unique()
    .references(() => usersTable.id),
  calendarViewStartTime: time().notNull().default("06:00:00"), // User's preferred calendar view start time
  calendarViewEndTime: time().notNull().default("22:00:00"), // User's preferred calendar view end time
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Assistant Tables

/**
 * A persisted assistant chat. `id` is generated by the client (the AI SDK's
 * `generateId`) so a new chat can be linked before its first response lands;
 * ownership is always enforced against `userId`, never the id alone.
 */
export const assistantConversationsTable = pgTable(
  "assistant_conversations",
  {
    id: varchar({ length: 64 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull().default("New chat"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("assistant_conversations_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
  ]
);

/**
 * One row per UI message (`UIMessage`). `parts` holds the SDK's message parts
 * verbatim so tool calls and results survive a reload. `message_id` is the SDK
 * message id and is unique per conversation so streaming can upsert.
 */
export const assistantMessagesTable = pgTable(
  "assistant_messages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    conversationId: varchar("conversation_id", { length: 64 }).notNull(),
    messageId: varchar("message_id", { length: 64 }).notNull(),
    role: varchar({ length: 20 }).notNull(),
    parts: jsonb().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Auto-generated name is 64 chars and gets truncated by Postgres.
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [assistantConversationsTable.id],
      name: "assistant_messages_conversation_id_fk",
    }).onDelete("cascade"),
    unique("assistant_messages_conversation_message_unique").on(
      table.conversationId,
      table.messageId
    ),
    index("assistant_messages_conversation_idx").on(
      table.conversationId,
      table.createdAt,
      table.id
    ),
  ]
);
