import type { Route } from "./+types/login";
import { Form } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sanctuary" },
    { name: "description", content: "Welcome to Sanctuary!" },
  ];
}

export default function Login() {
  return (
    <div className="h-full flex items-center justify-center">
      <Form className="flex flex-col" method="post">
        <div className="flex flex-col items-center justify-center gap-4">
          <input
            className="border-2 border-gray-300 rounded-xl p-2"
            type="text"
            placeholder="Username"
          />
          <input
            className="border-2 border-gray-300 rounded-xl p-2"
            type="password"
            placeholder="Password"
          />

          <button
            type="submit"
            className="rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-black text-white hover:bg-gray-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
          </button>
        </div>
      </Form>
    </div>
  );
}
