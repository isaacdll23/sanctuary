import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sanctuary" },
    { name: "description", content: "Welcome to Sanctuary!" },
  ];
}

export default function Home() {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h1 className="text-9xl">Sanctuary</h1>
    </div>
  );
}
