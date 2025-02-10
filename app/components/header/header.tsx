import Navbar from "./navbar/navbar";
import { useLoaderData } from "react-router";

export default function Header() {
  const { isAuthenticated } = useLoaderData<{ isAuthenticated: boolean }>();

  return (
    <header className="text-white p-4 h-16">
      <Navbar isAuthenticated={isAuthenticated} />
    </header>
  );
}
