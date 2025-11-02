import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("finance/expenses", "routes/finance/expenses.tsx"),
  route("finance/income", "routes/finance/income.tsx"),
  // Shared Budgets
  route("finance/budgets/shared", "routes/finance/budgets/shared/_index.tsx"),
  route("finance/budgets/shared/new", "routes/finance/budgets/shared/new.tsx"),
  route(
    "finance/budgets/shared/:budgetId",
    "routes/finance/budgets/shared/$budgetId/_index.tsx"
  ),
  route(
    "finance/budgets/shared/:budgetId/settings",
    "routes/finance/budgets/shared/$budgetId/settings.tsx"
  ),
  route(
    "finance/budgets/join/:token",
    "routes/finance/budgets/join/$token.tsx"
  ),
  // ...existing code...
  route("tasks", "routes/tasks/tasks.tsx"),
  route("day-planner", "routes/day-planner/day-planner.tsx"),
  route("notes", "routes/notes/notes.tsx"),
  route("utilities/commands", "routes/utilities/commands.tsx"),
  route("admin", "routes/admin/admin.tsx"),
  route("settings", "routes/settings.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
  route("auth/google/callback", "routes/auth/google/callback.tsx"),
] satisfies RouteConfig;
