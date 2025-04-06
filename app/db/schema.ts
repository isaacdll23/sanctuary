import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Core Tables
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 1024 }).notNull(),
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
  createdAt: timestamp().defaultNow().notNull(),
});

export const financeIncomeTable = pgTable("finance_income", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id),
  annualGrossIncome: integer().notNull(),
  taxDeductionPercentage: integer().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
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
    version: varchar({ length: 255 }).notNull(),
    command: varchar({ length: 4096 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  }
);
