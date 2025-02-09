import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h1 className="text-3xl">Welcome to Sanctuary!</h1>
    </div>
  );
}
