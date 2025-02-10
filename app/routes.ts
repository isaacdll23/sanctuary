import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("golf", "routes/golf/golf.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("tasks", "routes/tasks/tasks.tsx"),
  route("auth/login", "routes/auth/login.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),
  route("auth/register", "routes/auth/register.tsx"),
] satisfies RouteConfig;
