import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("finance", "routes/finance/finance.tsx"),
  route("finance/expenses", "routes/finance/expenses.tsx"),
  route("finance/income", "routes/finance/income.tsx"),
  route("tasks", "routes/tasks/tasks.tsx"),
  route("notes", "routes/notes/notes.tsx"),
  route("utilities/commands", "routes/utilities/commands.tsx"),
  route("admin", "routes/admin/admin.tsx"),
  route("profile", "routes/profile.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
  route("auth/reset-password", "routes/auth/reset-password.tsx"),
] satisfies RouteConfig;
