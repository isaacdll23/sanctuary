import { NavLink } from "react-router";

export default function Navbar() {
  return (
    <div className="flex flex-row space-x-4">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/golf">Golf</NavLink>
    </div>
  );
}