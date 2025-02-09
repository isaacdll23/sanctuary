import { NavLink } from "react-router";

export default function Navbar() {
  return (
    <div className="flex flex-row justify-between space-x-4">
      <div className="text-2xl">
        <NavLink to="/">Sanctuary</NavLink>
      </div>
      <div className="flex flex-row space-x-4">
        <NavLink to="/golf">Golf</NavLink>
        <NavLink to="/auth/login">Login</NavLink>
      </div>
    </div>
  );
}
