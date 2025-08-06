import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  json,
  serial,
} from "drizzle-orm/pg-core";

// Core Tables
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 1024 }).notNull(),
  role: varchar({ length: 50 }).default("user").notNull(),
  allowedPages: json(), // JSON array of page identifiers that the user can access
  resetPasswordToken: varchar({ length: 255 }), // Token for password reset
  resetPasswordExpires: timestamp(), // When the reset token expires
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
import { uuid, decimal, date, pgEnum } from "drizzle-orm/pg-core";

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
