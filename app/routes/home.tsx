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
      <h1 className="text-3xl mb-4">Welcome to Sanctuary!</h1>
      <p>You probably shouldn't be here..</p>
      <p>Might be a good idea to leave</p>
    </div>
  );
}
