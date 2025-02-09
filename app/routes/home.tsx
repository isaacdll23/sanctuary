import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <h1 className="text-9xl">Sanctuary</h1>
    </div>
  );
}
