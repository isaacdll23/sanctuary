import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("golf", "routes/golf/golf.tsx"),
] satisfies RouteConfig;
